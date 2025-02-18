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
    hubConnection.On<byte[]>("onAttachmentReceive", fileBytes =>
    {
        Console.WriteLine($"Received scanned file. Size: {fileBytes.Length} bytes.");
        // You can save the file locally if needed
        System.IO.File.WriteAllBytes("scanned_document.jpg", fileBytes);
        Console.WriteLine("File saved as 'scanned_document.jpg'.");
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
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
finally
{
    await hubConnection.StopAsync();
}