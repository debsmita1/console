package devfile

// Schema is the index file schema for Samples
type Schema struct {
	Name        string            `yaml:"name,omitempty" json:"name,omitempty"`
	DisplayName string            `yaml:"displayName,omitempty" json:"displayName,omitempty"`
	Description string            `yaml:"description,omitempty" json:"description,omitempty"`
	Tags        []string          `yaml:"tags,omitempty" json:"tags,omitempty"`
	Icon        string            `yaml:"icon,omitempty" json:"icon,omitempty"`
	Type        string            `yaml:"type,omitempty" json:"type,omitempty"`
	ProjectType string            `yaml:"projectType,omitempty" json:"projectType,omitempty"`
	Language    string            `yaml:"language,omitempty" json:"language,omitempty"`
	Git         *GitProjectSource `yaml:"git,omitempty" json:"git,omitempty"`
}

// GitProjectSource is the struct that defines the various remote definition.
// For example, "origin": "https://github.com/redhat-developer/devfile-sample"
type GitProjectSource struct {
	Remotes map[string]string `yaml:"remotes" json:"remotes"`
}
