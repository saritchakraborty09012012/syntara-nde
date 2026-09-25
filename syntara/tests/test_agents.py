import unittest

from syntara import Syntara
from syntara.tests.mock_gateway import start_gateway


def echo(args):
    return {"echoed": args.get("text", "")}


class AgentsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd, cls.base = start_gateway()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def setUp(self):
        self.client = Syntara(self.base + "/v1")

    def test_plain_task_is_a_chat(self):
        result = self.client.agents.run("hello")
        self.assertEqual(result["content"], "answer:hello")
        self.assertEqual(result["tool_calls"], [])

    def test_tool_loop_executes_local_handler(self):
        result = self.client.agents.run("call echo", tools={"echo": echo})
        self.assertGreaterEqual(result["steps"], 2)
        self.assertEqual(result["content"], "echo:call echo")
        self.assertEqual(result["tool_calls"], [])

    def test_tool_call_without_handler_is_interrupted_honestly(self):
        result = self.client.agents.run("call echo", tools={})
        self.assertEqual(result["content"], None)
        self.assertTrue(result.get("interrupted"))
        self.assertTrue(result["tool_calls"])

    def test_max_steps_limits_the_loop(self):
        result = self.client.agents.run("call echo", tools={"echo": echo}, max_steps=0)
        self.assertTrue(result.get("interrupted"))
        self.assertEqual(result["steps"], 1)
        self.assertTrue(result["tool_calls"])


if __name__ == "__main__":
    unittest.main()