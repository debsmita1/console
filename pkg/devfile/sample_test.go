package devfile

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestGetRegistrySamples(t *testing.T) {

	tests := []struct {
		name        string
		registry    string
		wantSamples []Schema
		wantErr     bool
	}{
		{
			name:     "Fetch the sample placeholder",
			registry: "sample-placeholder.json",
			wantSamples: []Schema{
				{
					Name:        "nodejs-basic",
					DisplayName: "Basic NodeJS",
					Description: "A simple Hello world NodeJS application",
					Tags:        []string{"NodeJS", "Express"},
					Type:        "sample",
					ProjectType: "nodejs",
					Language:    "nodejs",
					Git: &GitProjectSource{
						Remotes: map[string]string{
							"origin": "https://github.com/redhat-developer/devfile-sample",
						},
					},
				},
				{
					Name:        "nodejs-basic-2",
					DisplayName: "Basic NodeJS 2",
					Description: "A simple Hello world NodeJS application 2",
					Tags:        []string{"NodeJS", "Express"},
					Icon:        "nodejs-icon.png",
					Type:        "sample",
					ProjectType: "nodejs",
					Language:    "nodejs",
					Git: &GitProjectSource{
						Remotes: map[string]string{
							"origin": "https://github.com/maysunfaisal/node-bulletin-board-2",
						},
					},
				},
			},
		},
		{
			name:     "Invalid json",
			registry: "invalid.json",
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bytes, err := GetRegistrySamples(tt.registry)
			if tt.wantErr && err == nil {
				t.Errorf("Expected error from test but got nil")
			} else if !tt.wantErr && err != nil {
				t.Errorf("Got unexpected error: %s", err)
			} else if !tt.wantErr {
				var registryIndex []Schema
				err = json.Unmarshal(bytes, &registryIndex)
				if err != nil {
					t.Errorf("Got unexpected error: %s", err)
					return
				}

				if !reflect.DeepEqual(registryIndex, tt.wantSamples) {
					t.Errorf("expected %+v does not match actual %+v", registryIndex, tt.wantSamples)
				}
			}
		})
	}
}
