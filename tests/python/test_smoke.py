import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "generated" / "python"))

from claude_config.types import (
    ClaudeCodeSettings,
    claude_code_settings_from_dict,
    claude_code_settings_to_dict,
    ClaudeCodePluginManifest,
    claude_code_plugin_manifest_from_dict,
    claude_code_plugin_manifest_to_dict,
)

examples_dir = Path(__file__).parent.parent.parent / "examples"


def test_settings_round_trip():
    data = json.loads(
        (examples_dir / "settings" / "valid" / "minimal.json").read_text()
    )
    settings = claude_code_settings_from_dict(data)
    out = claude_code_settings_to_dict(settings)
    assert out["permissions"]["defaultMode"] == "default"


def test_plugin_manifest_round_trip():
    data = json.loads(
        (examples_dir / "plugins" / "valid" / "full-metadata.json").read_text()
    )
    manifest = claude_code_plugin_manifest_from_dict(data)
    out = claude_code_plugin_manifest_to_dict(manifest)
    assert out["name"] == "code-review-helper"
    assert out["version"] == "1.2.0"
    assert out["license"] == "MIT"


def test_settings_permissions():
    data = json.loads(
        (examples_dir / "settings" / "valid" / "permissions-full.json").read_text()
    )
    settings = claude_code_settings_from_dict(data)
    out = claude_code_settings_to_dict(settings)
    assert isinstance(out["permissions"]["allow"], list)
    assert isinstance(out["permissions"]["deny"], list)


if __name__ == "__main__":
    test_settings_round_trip()
    test_plugin_manifest_round_trip()
    test_settings_permissions()
    print("All smoke tests passed")
