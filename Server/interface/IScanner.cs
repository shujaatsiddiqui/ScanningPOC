public interface IScanner
{
    bool IsScanning { get; }
    void Start();
    void Stop();
}

public class MockScanner : IScanner
{
    private bool _isScanning;

    public bool IsScanning => _isScanning;

    public void Start()
    {
        if (_isScanning)
        {
            Console.WriteLine("Scanner is already running.");
            return;
        }

        _isScanning = true;
        Console.WriteLine("Scanner started.");
        // Simulate scanning work
        SimulateScanning();
    }

    public void Stop()
    {
        if (!_isScanning)
        {
            Console.WriteLine("Scanner is not running.");
            return;
        }

        _isScanning = false;
        Console.WriteLine("Scanner stopped.");
    }

    private async void SimulateScanning()
    {
        await Task.Run(() =>
        {
            while (_isScanning)
            {
                Console.WriteLine("Scanning...");
                Thread.Sleep(1000); // Simulate work
            }
        });
    }
}
