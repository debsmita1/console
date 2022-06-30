package testenv

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"

	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
)

type ManglerConfig struct {
	TLS rest.TLSClientConfig
}

type Mangler struct {
	URL    *url.URL
	Config *rest.Config
}

func NewMangler(cfg *rest.Config) *Mangler {
	m := &Mangler{
		Config: cfg,
	}
	return m
}

func (m *Mangler) modifier(request *http.Request) {
	fmt.Printf("\n\n%v\n\n", request)
	murl, _ := url.Parse(m.Config.Host)
	request.URL.Host = murl.Host
	request.URL.Scheme = murl.Scheme

	request.Host = murl.Host
	fmt.Printf("\n\n%v\n\n", request)
}

func StartTestEnvironment() {
	testEnvironment := &envtest.Environment{
		CRDDirectoryPaths: []string{
			filepath.Join("static"), // added to the project manually
		},
	}

	fmt.Print("Starting test-env....\n")

	cfg, err := testEnvironment.Start()

	if err != nil {
		fmt.Print(err)
		os.Exit(127)
	}

	os.WriteFile("/tmp/cert.cert", cfg.TLSClientConfig.CertData, 0664)
	os.WriteFile("/tmp/ca.cert", cfg.TLSClientConfig.CAData, 0664)
	os.WriteFile("/tmp/key.key", cfg.TLSClientConfig.KeyData, 0664)

	mangler := NewMangler(
		cfg,
	)

	cert, err := tls.X509KeyPair(cfg.TLSClientConfig.CertData, cfg.TLSClientConfig.KeyData)
	if err != nil {
		fmt.Printf("BADNESS CERT")
		os.Exit(127)
	}

	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(cfg.TLSClientConfig.CAData)

	proxy := httputil.ReverseProxy{
		Director: mangler.modifier,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs:      caCertPool,
				Certificates: []tls.Certificate{cert},
			},
		},
	}
	proxyServer := http.Server{
		Addr:    "0.0.0.0:8090",
		Handler: &proxy,
	}

	fmt.Print("test-env started!\n\n")
	fmt.Printf("  API server:\n\n    %v\n\n", testEnvironment.Config.Host)
	fmt.Printf("  Proxied API server (no authentification is needed):\n\n    %v\n\n", "http://localhost:8090/")
	// fmt.Printf("Bearer token.. %v\n", testEnvironment.Config.BearerToken)
	// fmt.Printf("Config..       %v\n", testEnvironment.Config)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)

	go func() {
		fmt.Printf("\nloop")
		for sig := range c {
			fmt.Printf("\n%v", sig)
			fmt.Println("\nShutdown proxy server...")
			proxyServer.Shutdown(context.Background())
			fmt.Println("\nShutdown test-env...")
			testEnvironment.Stop()
			os.Exit(0)
		}
	}()

	go func() {
		proxyServer.ListenAndServe()
	}()
}
