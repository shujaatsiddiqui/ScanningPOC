using NAPS2.Images;
using NAPS2.Images.Gdi;
using NAPS2.Scan;
using Microsoft.AspNetCore.SignalR;

namespace Casex.DeviceManager.Connectors
{
    public class ScannerHub : Hub
    {
        private static CancellationTokenSource _scanCancellationTokenSource;

        public async Task<List<string>> GetDevices()
        {
            using var scanningContext = new ScanningContext(new GdiImageContext());
            var controller = new ScanController(scanningContext);
            var devices = await controller.GetDeviceList();
            return devices.Select(d => d.Name).ToList();
        }

        public async Task ScanPDF(string deviceName, int dpi, string pageSize, string paperSource, string colorSettings ) 
        {
            _scanCancellationTokenSource = new CancellationTokenSource();
            var cancellationToken = _scanCancellationTokenSource.Token;

            using var scanningContext = new ScanningContext(new GdiImageContext());
            var controller = new ScanController(scanningContext);

            // Query for available scanning devices
            var devices = await controller.GetDeviceList();
            var selectedDevice = devices.FirstOrDefault(d => d.Name.Equals(deviceName, StringComparison.OrdinalIgnoreCase));

            if (selectedDevice == null)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Scanning device not found.");
                return;
            }

            // Parse page size
            //if (!Enum.TryParse<PageSize>(pageSize, true, out var parsedPageSize))
            //{
            //    await Clients.Caller.SendAsync("ReceiveMessage", "Invalid Page Size.");
            //    return;
            //}

            // Parse paper source
            if (!Enum.TryParse<NAPS2.Scan.PaperSource>(paperSource, true, out var parsedPaperSource))
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Invalid Paper Source.");
                return;
            }

            if (!Enum.TryParse<NAPS2.Images.BitDepth>(colorSettings, true, out var parsedcolorSettings))
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Invalid Paper Source.");
                return;
            }

            // Set scanning options
            var options = new ScanOptions
            {
                Device = selectedDevice,
                PaperSource = parsedPaperSource,
                PageSize = PageSize.A4,
                Dpi = dpi,
                BitDepth = parsedcolorSettings
            };

            var outputDirectory = Path.Combine("output");
            Directory.CreateDirectory(outputDirectory); // Ensure the directory exists

            var base64Images = new List<string>();
            int pageNumber = 1;

            try
            {
                await foreach (var image in controller.Scan(options).WithCancellation(cancellationToken))
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        await Clients.Caller.SendAsync("ReceiveMessage", "Scanning was cancelled.");
                        break;
                    }

                    using var memoryStream = new MemoryStream();

                    // Save image to memory stream in JPEG format for compatibility with frontend expectations
                    image.Save(memoryStream, NAPS2.Images.ImageFileFormat.Jpeg);
                    memoryStream.Position = 0;

                    // Convert image to Base64 string with the expected data URL prefix
                    var base64String = $"data:image/jpeg;base64,{Convert.ToBase64String(memoryStream.ToArray())}";
                    base64Images.Add(base64String);

                    // Optionally save images to disk for debugging or record-keeping
                    var filename = Path.Combine(outputDirectory, $"page{pageNumber++}.jpg");
                    await File.WriteAllBytesAsync(filename, memoryStream.ToArray());

                    image.Dispose();
                }

                if (base64Images.Count == 0)
                {
                    await Clients.Caller.SendAsync("ReceiveMessage", "No images were scanned.");
                    return;
                }

                // Send the list of Base64-encoded images with data URL prefix to the caller
                await Clients.Caller.SendAsync("onAttachmentReceive", base64Images);
            }
            catch (OperationCanceledException)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Scanning operation was cancelled successfully.");
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", $"Error during scanning: {ex.Message}");
            }
        }

        public async Task StopScanning()
        {
            if (_scanCancellationTokenSource != null && !_scanCancellationTokenSource.IsCancellationRequested)
            {
                _scanCancellationTokenSource.Cancel();
                await Clients.Caller.SendAsync("ReceiveMessage", "Scan cancellation requested.");
            }
            else
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "No ongoing scan to cancel.");
            }
        }
    }
}
