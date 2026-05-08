"""Notification adapters for ntfy and Discord.

Configure with env vars:
  NTFY_URL          e.g. https://ntfy.sh/your-secret-topic
  NTFY_TOKEN        optional bearer token for self-hosted ntfy
  DISCORD_WEBHOOK   Discord webhook URL
"""

import os
import logging
from urllib.parse import urlparse

import requests

log = logging.getLogger(__name__)

# ntfy's HTTP header API enforces Latin-1 on Title/Message, which trips on emoji.
# Use the JSON publish endpoint instead — POST to the server root with topic in
# the body — so the whole pipeline is UTF-8 clean.
_PRIORITY = {"min": 1, "low": 2, "default": 3, "high": 4, "max": 5}


def send_ntfy(title: str, body: str, priority: str = "default", tags: list[str] | None = None) -> bool:
    url = os.environ.get("NTFY_URL")
    if not url:
        log.warning("NTFY_URL not set; skipping ntfy push for %r", title)
        return False
    parsed = urlparse(url)
    topic = parsed.path.strip("/")
    if not topic:
        log.error("NTFY_URL %r has no topic in path", url)
        return False
    base = f"{parsed.scheme}://{parsed.netloc}"
    payload: dict[str, object] = {
        "topic": topic,
        "title": title,
        "message": body,
        "priority": _PRIORITY.get(priority, 3) if isinstance(priority, str) else priority,
    }
    if tags:
        payload["tags"] = tags
    headers: dict[str, str] = {}
    token = os.environ.get("NTFY_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.post(base, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        return True
    except requests.RequestException as exc:
        log.error("ntfy send failed: %s", exc)
        return False


def send_discord(title: str, body: str) -> bool:
    url = os.environ.get("DISCORD_WEBHOOK")
    if not url:
        log.warning("DISCORD_WEBHOOK not set; skipping Discord push for %r", title)
        return False
    payload = {
        "embeds": [
            {
                "title": title,
                "description": body,
                "color": 0x7C9CFF,
            }
        ]
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        return True
    except requests.RequestException as exc:
        log.error("discord send failed: %s", exc)
        return False


def dispatch(channels: list[str], title: str, body: str, **kwargs) -> dict[str, bool]:
    results = {}
    if "ntfy" in channels:
        results["ntfy"] = send_ntfy(title, body, **kwargs)
    if "discord" in channels:
        results["discord"] = send_discord(title, body)
    return results
