package version

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
)

var packageVersionRegex = regexp.MustCompile(`("version"\s*:\s*)"[^"]*"`)

func ReadPackageJSON(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("leer package.json: %w", err)
	}
	var obj map[string]interface{}
	if err := json.Unmarshal(data, &obj); err != nil {
		return "", fmt.Errorf("parsear package.json: %w", err)
	}
	v, ok := obj["version"].(string)
	if !ok {
		return "", fmt.Errorf("campo 'version' no encontrado o no es string en package.json")
	}
	return v, nil
}

func WritePackageJSON(path, newVersion string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("leer package.json: %w", err)
	}
	newContent := packageVersionRegex.ReplaceAllString(string(data), `${1}"`+newVersion+`"`)
	return os.WriteFile(path, []byte(newContent), 0644)
}
