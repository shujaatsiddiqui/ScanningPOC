using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Casex.DeviceManager.Connectors;

namespace Casex.DeviceManager
{
    internal class TrayApplicationContext : ApplicationContext
    {
        private bool _isConnected = false;
        const string serverURL = "http://localhost:5230";
        private NotifyIcon trayIcon;
        private IHost signalRHost;

        private readonly NotifyIcon _trayIcon;
        //Icon defaultIcon = System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath);

        public TrayApplicationContext()
        {
            // Create the tray icon
            _trayIcon = new NotifyIcon
            {
                Icon = System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath), //System.Drawing.SystemIcons.Application, // Use a system icon
                ContextMenuStrip = CreateContextMenu(),  //ContextMenuStrip = CreateContextMenu(),
                Visible = true,
                Text = "Scanner"
            };
        }

        private ContextMenuStrip CreateContextMenu()
        {
            // Create context menu
            ContextMenuStrip menu = new ContextMenuStrip();

            // Add Start
            ToolStripMenuItem startItem = new ToolStripMenuItem("Start", null, OnStart);
            menu.Items.Add(startItem);

            // Add Stop
            ToolStripMenuItem stopItem = new ToolStripMenuItem("Stop", null, OnStop);
            menu.Items.Add(stopItem);

            // Add Exit
            ToolStripMenuItem exitItem = new ToolStripMenuItem("Exit", null, OnExit);
            menu.Items.Add(exitItem);

            return menu;
        }

        private async void OnStart(object sender, EventArgs e)
        {
            try
            {
                if (signalRHost == null)
                {
                    signalRHost = CreateSignalRHost();
                    await signalRHost.StartAsync();
                    MessageBox.Show("SignalR server started.");
                }
                else
                {
                    MessageBox.Show("SignalR server is already running.");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to start SignalR server: {ex.Message}");
            }
        }

        private async void OnStop(object sender, EventArgs e)
        {
            try
            {
                if (signalRHost != null)
                {
                    await signalRHost.StopAsync();
                    signalRHost.Dispose();
                    signalRHost = null;
                    MessageBox.Show("SignalR server stopped.");
                }
                else
                {
                    MessageBox.Show("SignalR server is not running.");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to stop SignalR server: {ex.Message}");
            }
        }

        private void OnExit(object sender, EventArgs e)
        {
            trayIcon.Visible = false;

            if (signalRHost != null)
            {
                signalRHost.StopAsync().Wait();
                signalRHost.Dispose();
            }

            Application.Exit();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && _trayIcon != null)
            {
                _trayIcon.Dispose();
            }
            base.Dispose(disposing);
        }

        private IHost CreateSignalRHost()
        {
            return Host.CreateDefaultBuilder()
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseUrls(serverURL); // Specify the SignalR server URL
                    webBuilder.ConfigureServices(services =>
                    {
                        services.AddSignalR();
                    });
                    webBuilder.Configure(app =>
                    {
                        app.UseRouting();
                        app.UseEndpoints(endpoints =>
                        {
                            endpoints.MapHub<ScannerHub>("/scannerHub"); // Map the SignalR hub
                        });
                    });
                })
                .Build();
        }

    }

}
