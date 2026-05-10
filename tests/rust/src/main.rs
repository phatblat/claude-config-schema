use std::fs;
use std::path::Path;

fn main() {
    let examples_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("examples");

    // Settings round-trip
    let settings_json =
        fs::read_to_string(examples_dir.join("settings/valid/minimal.json")).unwrap();
    let settings: claude_code_config::ClaudeCodeSettings =
        serde_json::from_str(&settings_json).unwrap();
    let settings_out = serde_json::to_string(&settings).unwrap();
    let reparsed: serde_json::Value = serde_json::from_str(&settings_out).unwrap();
    assert_eq!(
        reparsed["permissions"]["defaultMode"], "default",
        "settings round-trip: defaultMode mismatch"
    );

    // Plugin manifest round-trip
    let plugin_json =
        fs::read_to_string(examples_dir.join("plugins/valid/full-metadata.json")).unwrap();
    let manifest: claude_code_config::ClaudeCodePluginManifest =
        serde_json::from_str(&plugin_json).unwrap();
    let manifest_out = serde_json::to_string(&manifest).unwrap();
    let reparsed: serde_json::Value = serde_json::from_str(&manifest_out).unwrap();
    assert_eq!(
        reparsed["name"], "code-review-helper",
        "plugin round-trip: name mismatch"
    );

    println!("All smoke tests passed");
}
