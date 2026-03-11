package version

import (
	"os"
	"path/filepath"
	"testing"
)

// ─── Parse ───────────────────────────────────────────────────────────────────

func TestParse_Valid(t *testing.T) {
	cases := []struct {
		input string
		want  Version
	}{
		{"1.2.3", Version{1, 2, 3}},
		{"0.0.0", Version{0, 0, 0}},
		{"10.20.30", Version{10, 20, 30}},
	}
	for _, tc := range cases {
		got, err := Parse(tc.input)
		if err != nil {
			t.Errorf("Parse(%q) unexpected error: %v", tc.input, err)
			continue
		}
		if got != tc.want {
			t.Errorf("Parse(%q) = %v, want %v", tc.input, got, tc.want)
		}
	}
}

func TestParse_Invalid(t *testing.T) {
	invalid := []string{
		"",
		"1.2",
		"1.2.3.4",
		"a.b.c",
		"1.2.x",
		"v1.2.3",
	}
	for _, s := range invalid {
		_, err := Parse(s)
		if err == nil {
			t.Errorf("Parse(%q) should return error, got nil", s)
		}
	}
}

// ─── Bump ─────────────────────────────────────────────────────────────────────

func TestBump(t *testing.T) {
	base := Version{1, 2, 3}
	cases := []struct {
		bumpType BumpType
		want     Version
	}{
		{BumpPatch, Version{1, 2, 4}},
		{BumpMinor, Version{1, 3, 0}},
		{BumpMajor, Version{2, 0, 0}},
	}
	for _, tc := range cases {
		got := base.Bump(tc.bumpType)
		if got != tc.want {
			t.Errorf("Bump(%v) = %v, want %v", tc.bumpType, got, tc.want)
		}
	}
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

func TestTag(t *testing.T) {
	v := Version{1, 2, 3}
	cases := []struct {
		variant string
		want    string
	}{
		{"production", "v1.2.3-production"},
		{"staging", "v1.2.3-staging"},
		{"alpha", "v1.2.3-alpha"},
	}
	for _, tc := range cases {
		got := v.Tag(tc.variant)
		if got != tc.want {
			t.Errorf("Tag(%q) = %q, want %q", tc.variant, got, tc.want)
		}
	}
}

// ─── WriteCargoToml — preserva secciones ─────────────────────────────────────

const cargoFixture = `[package]
name = "my-app"
version = "1.0.0"
edition = "2021"

[dependencies]
serde = { version = "1.0.217", features = ["derive"] }
tokio = { version = "1.44.0", features = ["full"] }

[dev-dependencies]
mockall = { version = "0.13.1" }
`

func TestWriteCargoToml_PreservesOtherSections(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "Cargo.toml")

	if err := os.WriteFile(path, []byte(cargoFixture), 0644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	if err := WriteCargoToml(path, "2.0.0"); err != nil {
		t.Fatalf("WriteCargoToml: %v", err)
	}

	got, err := ReadCargoToml(path)
	if err != nil {
		t.Fatalf("ReadCargoToml after write: %v", err)
	}
	if got != "2.0.0" {
		t.Errorf("version = %q, want %q", got, "2.0.0")
	}

	// Verificar que las versiones de dependencias NO fueron modificadas
	data, _ := os.ReadFile(path)
	content := string(data)

	mustContain := []string{
		`serde = { version = "1.0.217"`,
		`tokio = { version = "1.44.0"`,
		`mockall = { version = "0.13.1"`,
	}
	for _, s := range mustContain {
		if !containsStr(content, s) {
			t.Errorf("dependency version corrupted, missing: %q\nfile content:\n%s", s, content)
		}
	}
}

// ─── WritePackageJSON — preserva otros campos ─────────────────────────────────

const packageJSONFixture = `{
  "name": "tps-intermotors",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^18.0.0"
  }
}
`

func TestWritePackageJSON_PreservesOtherFields(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "package.json")

	if err := os.WriteFile(path, []byte(packageJSONFixture), 0644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	if err := WritePackageJSON(path, "2.5.1"); err != nil {
		t.Fatalf("WritePackageJSON: %v", err)
	}

	got, err := ReadPackageJSON(path)
	if err != nil {
		t.Fatalf("ReadPackageJSON after write: %v", err)
	}
	if got != "2.5.1" {
		t.Errorf("version = %q, want %q", got, "2.5.1")
	}

	data, _ := os.ReadFile(path)
	content := string(data)

	mustContain := []string{
		`"name": "tps-intermotors"`,
		`"private": true`,
		`"dev": "vite"`,
		`"react": "^18.0.0"`,
	}
	for _, s := range mustContain {
		if !containsStr(content, s) {
			t.Errorf("field corrupted, missing: %q\nfile content:\n%s", s, content)
		}
	}
}

// ─── helpers ─────────────────────────────────────────────────────────────────

func containsStr(s, substr string) bool {
	return len(s) >= len(substr) && func() bool {
		for i := 0; i <= len(s)-len(substr); i++ {
			if s[i:i+len(substr)] == substr {
				return true
			}
		}
		return false
	}()
}
