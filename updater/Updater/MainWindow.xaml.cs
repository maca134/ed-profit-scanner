using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Windows;
using Ionic.Zip;

namespace Updater
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow
    {
        public MainWindow()
        {
            InitializeComponent();
            DataContext = this;

            var args = Environment.GetCommandLineArgs();
            if (args.Length != 4)
            {
                Exit("Incorrect parameters");
            }
            var basepath = args[1];
            if (!Path.IsPathRooted(basepath))
                basepath = Path.Combine(Environment.CurrentDirectory, basepath);
            Log($"Base path: {basepath}");

            var updateurl = args[2];
            Log($"Update Url: {updateurl}");

            var appName = args[3];
            Log($"App name: {appName}");

            Task.Factory.StartNew(() =>
            {
                Log("Starting update process");

                if (!Directory.Exists(basepath))
                {
                    Directory.CreateDirectory(basepath);
                }

                var zipfile = Path.GetTempPath() + Guid.NewGuid() + ".zip";
                Log("Downloading update to " + zipfile);
                try
                {
                    using (var webclient = new WebClient())
                    {
                        webclient.DownloadFile(new Uri(updateurl), zipfile);
                    }
                }
                catch
                {
                    Exit("Error downloading update");
                    return;
                }

                Log("Deleting old files");
                var files = Directory.GetFiles(basepath, "*.*", SearchOption.AllDirectories).Where(s => !s.EndsWith(".json")).ToArray();
                foreach (var file in files)
                {
                    try
                    {
                        Log("Deleting: " + file);
                        File.Delete(file);
                    }
                    catch (Exception ex)
                    {
                        Log("Error deleting file: " + file);
                    }
                }

                Log("Extracting update");
                try
                {
                    using (var zipFile = ZipFile.Read(zipfile))
                    {
                        foreach (var zipe in zipFile)
                        {
                            zipe.Extract(basepath, ExtractExistingFileAction.OverwriteSilently);
                        }
                    }
                }
                catch
                {

                    Exit("Error 4 extracting update");
                    return;
                }

                Log("Cleaning up");
                try
                {
                    File.Delete(zipfile);
                }
                catch
                {

                    Exit("Error 5 cleaning up");
                    return;
                }

                Log("Complete");

                var process = new Process
                {
                    StartInfo =
                    {
                        FileName = Path.Combine(basepath, $"{appName}.exe"),
                        WorkingDirectory = basepath
                    }
                };
                try
                {
                    process.Start();
                }
                catch
                {
                    // ignore
                }
                Environment.Exit(0);
            });


        }

        private void Log(string message)
        {
            Console.WriteLine($"Log: {message}");
            Application.Current.Dispatcher.Invoke(() =>
            {
                Output.Text += message + "\n";
                Output.ScrollToEnd();
            });
        }

        private static void Exit(string message)
        {
            Application.Current.Dispatcher.Invoke(() => MessageBox.Show(message, "Error"));
            Environment.Exit(0);
        }

    }
}
