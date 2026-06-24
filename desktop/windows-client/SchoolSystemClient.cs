using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace SchoolSystemClient
{
    internal static class Program
    {
        private const string AppUrl = "https://schoolsystem.com.cn";

        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                if (LaunchAppMode()) return;
                Process.Start(new ProcessStartInfo(AppUrl) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Windows 客户端启动失败，请确认已安装 Microsoft Edge 或 Chrome。\n\n" + ex.Message,
                    "校衡台",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static bool LaunchAppMode()
        {
            var launchUrl = GetLaunchUrl();
            foreach (var browserPath in GetBrowserCandidates())
            {
                if (!File.Exists(browserPath)) continue;

                Process.Start(new ProcessStartInfo
                {
                    FileName = browserPath,
                    Arguments = "--app=\"" + launchUrl + "\"",
                    UseShellExecute = false
                });
                return true;
            }

            return false;
        }

        private static string GetLaunchUrl()
        {
            return AppUrl;
        }

        private static string[] GetBrowserCandidates()
        {
            var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            return new[]
            {
                Path.Combine(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(localAppData, "Google", "Chrome", "Application", "chrome.exe")
            };
        }
    }
}
