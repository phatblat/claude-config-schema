package claudeconfig_test

import (
	"os"
	"testing"

	claudeconfig "github.com/phatblat/claude-config-schema/generated/go"
)

func TestSettingsUnmarshalMarshal(t *testing.T) {
	data, err := os.ReadFile("../../examples/settings/valid/minimal.json")
	if err != nil {
		t.Fatalf("failed to read example: %v", err)
	}

	settings, err := claudeconfig.UnmarshalClaudeCodeSettings(data)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if settings.Permissions == nil {
		t.Fatal("expected permissions to be non-nil")
	}

	if settings.Permissions.DefaultMode == nil || string(*settings.Permissions.DefaultMode) != "default" {
		t.Errorf("expected defaultMode to be 'default'")
	}

	_, err = settings.Marshal()
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
}

func TestPluginManifestUnmarshalMarshal(t *testing.T) {
	data, err := os.ReadFile("../../examples/plugins/valid/full-metadata.json")
	if err != nil {
		t.Fatalf("failed to read example: %v", err)
	}

	manifest, err := claudeconfig.UnmarshalClaudeCodePluginManifest(data)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if manifest.Name != "code-review-helper" {
		t.Errorf("expected name 'code-review-helper', got %v", manifest.Name)
	}

	if manifest.Version == nil || *manifest.Version != "1.2.0" {
		t.Errorf("expected version '1.2.0', got %v", manifest.Version)
	}

	if manifest.License == nil || *manifest.License != "MIT" {
		t.Errorf("expected license 'MIT', got %v", manifest.License)
	}

	_, err = manifest.Marshal()
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
}

func TestSettingsPermissions(t *testing.T) {
	data, err := os.ReadFile("../../examples/settings/valid/permissions-full.json")
	if err != nil {
		t.Fatalf("failed to read example: %v", err)
	}

	settings, err := claudeconfig.UnmarshalClaudeCodeSettings(data)
	if err != nil {
		t.Fatalf("failed to unmarshal permissions example: %v", err)
	}

	if settings.Permissions == nil {
		t.Fatal("expected permissions to be non-nil")
	}

	if len(settings.Permissions.Allow) == 0 {
		t.Error("expected allow rules to be non-empty")
	}

	if len(settings.Permissions.Deny) == 0 {
		t.Error("expected deny rules to be non-empty")
	}
}
