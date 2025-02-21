using Microsoft.AspNetCore.SignalR.Client;

var hubConnection = new HubConnectionBuilder()
            .WithUrl("http://localhost:5230/scannerhub") // Replace with your actual SignalR hub URL
            .WithAutomaticReconnect()
            .Build();

try
{
    await hubConnection.StartAsync();
    Console.WriteLine("Connected to the ScannerHub.");

    // 1. Call GetDevices to fetch available scanner devices
    var devices = await hubConnection.InvokeAsync<List<string>>("GetDevices");

    if (devices.Count == 0)
    {
        Console.WriteLine("No scanning devices found.");
        return;
    }

    Console.WriteLine("Available Devices:");
    foreach (var device in devices)
    {
        Console.WriteLine($"- {device}");
    }

    // Select the first device for scanning
    string selectedDevice = devices[0];
    Console.WriteLine($"Using Device: {selectedDevice}");

    // 2. Listen for messages and file responses
    hubConnection.On<List<string>>("onAttachmentReceive", base64Images =>
    {
        Console.WriteLine($"Received {base64Images.Count} scanned images.");

        string outputDirectory = Path.Combine("output");
        Directory.CreateDirectory(outputDirectory); // Ensure output directory exists

        for (int i = 0; i < base64Images.Count; i++)
        {
            try
            {
                var base64String = base64Images[i];
                var imageBytes = Convert.FromBase64String(base64String);

                var fileName = Path.Combine(outputDirectory, $"scanned_page_{i + 1}.png");
                File.WriteAllBytes(fileName, imageBytes);

                Console.WriteLine($"Image {i + 1} saved as '{fileName}'.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving image {i + 1}: {ex.Message}");
            }
        }
    });

    hubConnection.On<string>("ReceiveMessage", message =>
    {
        Console.WriteLine($"Message from server: {message}");
    });

    // 3. Call ScanPDF method with required parameters
    Console.WriteLine("Initiating scan...");
    await hubConnection.InvokeAsync("ScanPDF", selectedDevice, 300, "A4", "Flatbed");

    // Wait for response
    Console.WriteLine("Waiting for scanned document...");
    await Task.Delay(10000); // Give some time to receive the scan result
    Console.ReadLine();
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
finally
{
    await hubConnection.StopAsync();
}