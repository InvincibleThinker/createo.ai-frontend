import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";

interface PreviewFrameProps {
  webContainer: WebContainer | null;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function main() {
      // Check if webContainer is initialized
      if (!webContainer) {
        console.error("WebContainer is not initialized");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Install dependencies
        const installProcess = await webContainer.spawn("npm", ["install"]);

        // Pipe output (optional, but can help with debugging)
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log("Install output:", data);
            },
          })
        );

        // Wait for install to complete
        await installProcess.exit;

        // Start dev server
        const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

        // Wait for server to be ready
        webContainer.on("server-ready", (port, serverUrl) => {
          console.log("Server ready at:", serverUrl);
          console.log("Port:", port);
          setUrl(serverUrl);
          setIsLoading(false);
        });

        // Handle any potential errors
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log("Dev server output:", data);
            },
          })
        );
      } catch (error) {
        console.error("Error setting up WebContainer:", error);
        setIsLoading(false);
      }
    }

    main();

    // Optional: cleanup function
    return () => {
      // Perform any necessary cleanup
      webContainer?.teardown();
    };
  }, [webContainer]);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      )}
      {url && <iframe width="100%" height="100%" src={url} />}
    </div>
  );
}
