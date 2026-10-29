# -*- coding: utf-8 -*-
"""Static site plus contact / listing mail. SMTP settings stay in private/mail.json."""
import json
import re
import smtplib
import time
from email.message import EmailMessage
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CFG = json.loads((ROOT / "private" / "mail.json").read_text(encoding="utf-8"))
LIMITS = {
    "name": 80,
    "contact": 120,
    "message": 2000,
    "url": 200,
    "api": 200,
    "models": 300,
    "pays": 120,
    "min": 80,
    "desc": 2000,
    "note": 2000,
    "test_user": 120,
    "test_secret": 500,
    "test_note": 500,
}
CONTACT = ["name", "contact", "message"]
SUBMIT = ["name", "url", "api", "models", "pays", "min", "contact", "desc", "note", "test_user", "test_secret", "test_note"]
LABELS = {
    "name": "名称",
    "contact": "联系方式",
    "message": "留言",
    "url": "站点网址",
    "api": "API 地址",
    "models": "支持的模型",
    "pays": "支付方式",
    "min": "起充或汇率",
    "desc": "简介",
    "note": "补充说明",
    "test_user": "测试账号",
    "test_secret": "测试密码或 Key",
    "test_note": "测试账户说明",
}
HITS = {}


def clip(value, limit):
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", str(value or "")).strip()
    if len(text) > limit:
        raise ValueError("某一项太长了")
    return text


def clean(fields, names):
    src = fields if isinstance(fields, dict) else {}
    out = {}
    for name in names:
        out[name] = clip(src.get(name, ""), LIMITS[name])
    return out


def allow(ip):
    now = time.time()
    recent = [t for t in HITS.get(ip, []) if now - t < 600]
    if len(recent) >= 8:
        HITS[ip] = recent
        return False
    recent.append(now)
    HITS[ip] = recent
    return True


def compose(kind, fields):
    if kind == "contact":
        if not fields["contact"] or not fields["message"]:
            raise ValueError("请填写联系方式和留言")
        subject = "【HowToken】联系我们 " + (fields["name"] or fields["contact"])
        lines = ["来源：HowToken"] + [LABELS[name] + "：" + (fields[name] or "—") for name in CONTACT]
        reply = fields["contact"]
    elif kind == "submit":
        if not fields["name"] or not fields["url"] or not fields["contact"]:
            raise ValueError("请填写站点名称、网址和联系方式")
        subject = "【HowToken】收录申请 " + fields["name"]
        lines = ["来源：HowToken"] + [LABELS[name] + "：" + (fields[name] or "—") for name in SUBMIT if not name.startswith("test_")]
        has_test = any(fields[name] for name in ("test_user", "test_secret", "test_note"))
        lines.append("")
        lines.append("测试账户：" + ("已提供" if has_test else "未提供"))
        for name in ("test_user", "test_secret", "test_note"):
            if fields[name]:
                lines.append(LABELS[name] + "：" + fields[name])
        reply = fields["contact"]
    else:
        raise ValueError("不认识的表单")
    subject = subject.replace("\r", " ").replace("\n", " ")[:80]
    return subject, "\n".join(lines), reply


def deliver(subject, body, reply):
    msg = EmailMessage()
    msg["From"] = CFG["user"]
    msg["To"] = CFG["to"]
    msg["Subject"] = subject
    if "@" in reply and " " not in reply and len(reply) <= 120:
        msg["Reply-To"] = reply
    msg.set_content(body)
    with smtplib.SMTP_SSL(CFG["host"], int(CFG["port"]), timeout=25) as smtp:
        smtp.login(CFG["user"], CFG["password"])
        smtp.send_message(msg)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        super().log_message(fmt, *args)

    def blocked(self):
        path = self.path.split("?", 1)[0]
        return path == "/private" or path.startswith("/private/")

    def do_GET(self):
        if self.blocked():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        if self.blocked():
            self.send_error(404)
            return
        super().do_HEAD()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/mail":
            self.send_error(404)
            return
        ip = self.client_address[0]
        if not allow(ip):
            self.reply(429, {"ok": False, "error": "提交太频繁，请稍后再试"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > 32768:
            self.reply(400, {"ok": False, "error": "提交内容不对"})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            kind = payload.get("kind")
            fields = payload.get("fields") or {}
            if fields.get("hp_field"):
                self.reply(200, {"ok": True})
                return
            names = CONTACT if kind == "contact" else SUBMIT if kind == "submit" else None
            if names is None:
                raise ValueError("不认识的表单")
            subject, body, reply = compose(kind, clean(fields, names))
            deliver(subject, body, reply)
        except ValueError as exc:
            self.reply(400, {"ok": False, "error": str(exc)})
            return
        except Exception:
            self.reply(502, {"ok": False, "error": "邮件没发出去，请稍后再试，或直接发到 2201219073@qq.com"})
            return
        self.reply(200, {"ok": True})

    def reply(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    print("http://127.0.0.1:8765/")
    server.serve_forever()
