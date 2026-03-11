package version

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
)

var tauriVersionRegex = regexp.MustCompile(`("version"\s*:\s*)"[^"]*"`)

func ReadTauriConf(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("leer tauri.conf.json: %w", err)
	}
	var obj map[string]interface{}
	if err := json.Unmarshal(data, &obj); err != nil {
		return "", fmt.Errorf("parsear tauri.conf.json: %w", err)
	}
	v, ok := obj["version"].(string)
	if !ok {
		return "", fmt.Errorf("campo 'version' no encontrado o no es string en tauri.conf.json")
	}
	return v, nil
}

func WriteTauriConf(path, newVersion string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("leer tauri.conf.json: %w", err)
	}
	newContent := tauriVersionRegex.ReplaceAllString(string(data), `${1}"`+newVersion+`"`)
	return os.WriteFile(path, []byte(newContent), 0644)
}
