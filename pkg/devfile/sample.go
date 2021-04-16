package devfile

import (
	"io/ioutil"
)

// GetRegistrySamples returns the list of samples, more specifically
// it gets the content of the index (index.json) of the specified registry.
// This is based on https://github.com/devfile/registry-support/blob/master/registry-library/library/library.go#L61
func GetRegistrySamples(registry string) ([]byte, error) {
	bytes, err := ioutil.ReadFile(registry)
	if err != nil {
		return nil, err
	}
	return bytes, nil
}
