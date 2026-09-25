import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from syntara import LocalStore
from syntara._version import __version__


class StoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def store(self, name="data"):
        return LocalStore(self.root / name)

    def test_projects_lifecycle(self):
        store = self.store()
        self.assertEqual(store.list_projects(), [])
        project = store.create_project("demo", description="a demo")
        self.assertTrue(project["id"].startswith("p_"))
        self.assertEqual(store.get_project(project["id"])["name"], "demo")
        self.assertEqual(len(store.list_projects()), 1)
        with self.assertRaises(ValueError):
            store.create_project("demo")
        with self.assertRaises(ValueError):
            store.create_project("  ")
        self.assertTrue(store.delete_project(project["id"]))
        self.assertFalse(store.delete_project(project["id"]))
        self.assertEqual(store.list_projects(), [])

    def test_memories_and_chats(self):
        store = self.store()
        memory = store.add_memory("remember this")
        self.assertTrue(memory["id"])
        self.assertEqual(len(store.list_memories()), 1)
        chat_id = store.save_chat([{"role": "user", "content": "hi"}])
        self.assertEqual(store.list_chats(), [chat_id])
        self.assertEqual(store.get_chat(chat_id)[0]["role"], "user")
        self.assertTrue(store.delete_chat(chat_id))

    def test_memories_update(self):
        store = self.store()
        memory = store.add_memory("first")
        updated = store.update_memory(memory["id"], "second")
        self.assertEqual(updated["text"], "second")
        self.assertEqual(store.list_memories()[0]["text"], "second")
        self.assertIsNone(store.update_memory("does-not-exist", "x"))
        with self.assertRaises(ValueError):
            store.update_memory(memory["id"], "  ")
        self.assertTrue(store.delete_memory(memory["id"]))

    def test_settings(self):
        store = self.store()
        store.set_settings({"theme": "dark"})
        self.assertEqual(store.settings()["theme"], "dark")
        store.set_settings({"theme": "light", "vram": 8})
        self.assertEqual(store.settings()["theme"], "light")
        self.assertEqual(store.settings()["vram"], 8)

    def test_settings_never_persist_credentials(self):
        store = self.store()
        store.set_settings({"api_key": "secret", "theme": "dark"})
        stored = store.settings()
        self.assertNotIn("api_key", stored)
        self.assertEqual(stored.get("theme"), "dark")

    def test_backup_roundtrip(self):
        source = self.store("source")
        source.create_project("p1")
        source.add_memory("m1")
        source.save_chat([{"role": "user", "content": "hi"}])
        source.set_settings({"theme": "dark"})
        backup = Path(self.tmp.name) / "bk"
        path = source.create_backup(out=backup)
        self.assertTrue(path.is_file())
        self.assertTrue(str(path).endswith(".syntara-backup"))

        info = source.verify_backup(path)
        self.assertTrue(info["ok"], info.get("error"))
        self.assertEqual(info["includes"], ["chats", "memories", "projects", "settings"])
        self.assertEqual(info["manifest"]["creator"]["version"], __version__)

        target = self.store("target")
        summary = target.restore_backup(path)
        self.assertIn("chats", summary["restored"])
        self.assertEqual(len(target.list_projects()), 1)
        self.assertEqual(len(target.list_memories()), 1)
        self.assertEqual(len(target.list_chats()), 1)
        self.assertEqual(target.settings()["theme"], "dark")

    def test_selective_restore(self):
        source = self.store("source")
        source.create_project("p1")
        source.add_memory("m1")
        source.save_chat([{"role": "user", "content": "hi"}])
        path = source.create_backup(out=self.root / "bk")

        target = self.store("target")
        summary = target.restore_backup(path, include="projects")
        self.assertEqual(summary["restored"], ["projects"])
        self.assertEqual(len(target.list_projects()), 1)
        self.assertEqual(len(target.list_chats()), 0)
        self.assertEqual(len(target.list_memories()), 0)

    def test_restore_memories_replace_mode(self):
        source = self.store("source")
        source.add_memory("from-backup")
        path = source.create_backup(out=self.root / "bk")
        target = self.store("target")
        target.add_memory("existing")
        target.restore_backup(path, include="memories", merge=False)
        self.assertEqual([m["text"] for m in target.list_memories()], ["from-backup"])

    def test_model_refs_are_metadata_only(self):
        store = self.store()
        path = store.create_backup(out=self.root / "bk",
                                   model_refs=[{"id": "qwen36", "source": "local"}])
        with zipfile.ZipFile(path) as archive:
            payload = json.loads(archive.read("models.json"))
        self.assertEqual(payload["models"][0]["id"], "qwen36")
        self.assertIn("note", payload)

    def test_verify_rejects_path_traversal(self):
        path = self.root / "evil.syntara-backup"
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("manifest.json", json.dumps({
                "format": "syntara-backup", "version": 1, "includes": ["settings"]}))
            archive.writestr("../evil.txt", "pwned")
        info = self.store().verify_backup(path)
        self.assertFalse(info["ok"])
        self.assertIn("unsafe", info["error"])

    def test_create_backup_with_unknown_section(self):
        with self.assertRaises(ValueError):
            self.store().create_backup(include="settings,secrets")

    def test_restore_rejects_bad_archive(self):
        bogus = self.root / "bogus.syntara-backup"
        bogus.write_text("not a zip", encoding="utf-8")
        with self.assertRaises(ValueError):
            self.store().restore_backup(bogus)


if __name__ == "__main__":
    unittest.main()