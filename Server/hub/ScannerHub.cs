using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.IO;
using NAPS2.Images;
using NAPS2.Images.Gdi;
using NAPS2.Pdf;
using NAPS2.Scan;
using Microsoft.AspNetCore.Mvc.RazorPages;
public class ScannerHub : Hub
{
    private readonly IScanner _scanner;

    public ScannerHub(IScanner scanner)
    {
        _scanner = scanner;
    }

    public async Task StartScanning()
    {
        _scanner.Start();
        //await Clients.All.SendAsync("ReceiveMessage", "Scanner started.");
        await ScanPDF();
    }

    public async Task StopScanning()
    {
        _scanner.Stop();
         await Clients.All.SendAsync("ReceiveMessage", "Scanner stopped.");
        //await SendPdfAsAttachment();
    }

    public async Task<bool> IsScanning()
    {
        return _scanner.IsScanning;
    }

    private async Task SendPdfAsAttachment()
    {
        string pdfFileName = "invoicesample.pdf";
        var filePath = Path.Combine("output", pdfFileName);

        if (File.Exists(filePath))
        {
            byte[] fileBytes = await File.ReadAllBytesAsync(filePath);

            await Clients.All.SendAsync("onAttachmentReceive", fileBytes);
        }
        else
        {
            await Clients.All.SendAsync("ReceiveMessage", $"File {pdfFileName} not found.");
        }
    }

    private async Task ScanPDF()
    {
        using var scanningContext = new ScanningContext(new GdiImageContext());
        var controller = new ScanController(scanningContext);

        // Query for available scanning devices
        var devices = await controller.GetDeviceList();

        // Set scanning options
        var options = new ScanOptions
        {
            Device = devices.First(),
            PaperSource = PaperSource.Flatbed,
            PageSize = PageSize.A4,
            Dpi = 300
        };

        string filename = "";
        // Scan and save images
        int i = 1;
        await foreach (var image in controller.Scan(options))
        {
            filename = Path.Combine("output", $"page{i++}.jpg");
            image.Save($"{filename}");
        }

        // Scan and save PDF
        //var images = await controller.Scan(options).ToListAsync();
        //var pdfExporter = new PdfExporter(scanningContext);
        //await pdfExporter.Export(filename, images);
        if (File.Exists(filename))
        {
            byte[] fileBytes = await File.ReadAllBytesAsync(filename);

                await Clients.All.SendAsync("onAttachmentReceive", fileBytes);
        }
        else
        {
            await Clients.All.SendAsync("ReceiveMessage", $"File {filename} not found.");
        }

    }
}
