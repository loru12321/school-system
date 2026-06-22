using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

namespace SchoolSystemInstaller
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(ShouldUninstall(args) ? (Form)new UninstallerForm() : new InstallerForm());
        }

        private static bool ShouldUninstall(string[] args)
        {
            foreach (var arg in args)
            {
                var value = (arg ?? "").Trim().ToLowerInvariant();
                if (value == "/uninstall" || value == "--uninstall" || value == "-uninstall") return true;
            }
            return false;
        }
    }

    internal static class InstallerShared
    {
        public const string AppName = "\u6821\u8861\u53f0";
        public const string LauncherFileName = "\u6821\u8861\u53f0.exe";
        public const string UninstallerFileName = "\u5378\u8f7d\u6821\u8861\u53f0.exe";
        public const string LauncherResourceName = "school-system-client.exe";
        public const string UninstallKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\SchoolSystem";

        public static Font UiFont(float size, FontStyle style = FontStyle.Regular)
        {
            return new Font("Microsoft YaHei UI", size, style);
        }

        public static void CreateShortcut(string shortcutPath, string targetPath)
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) return;
            dynamic shell = Activator.CreateInstance(shellType);
            dynamic shortcut = shell.CreateShortcut(shortcutPath);
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = Path.GetDirectoryName(targetPath);
            shortcut.IconLocation = targetPath;
            shortcut.Description = AppName + " Windows \u5ba2\u6237\u7aef";
            shortcut.Save();
        }

        public static string ReadInstallLocation()
        {
            using (var key = Registry.CurrentUser.OpenSubKey(UninstallKeyPath))
            {
                return Convert.ToString(key == null ? "" : key.GetValue("InstallLocation")) ?? "";
            }
        }

        public static void RegisterUninstaller(string installDir, string uninstallerPath)
        {
            using (var key = Registry.CurrentUser.CreateSubKey(UninstallKeyPath))
            {
                if (key == null) return;
                key.SetValue("DisplayName", AppName);
                key.SetValue("DisplayVersion", "1.0");
                key.SetValue("Publisher", "School System");
                key.SetValue("InstallLocation", installDir);
                key.SetValue("DisplayIcon", Path.Combine(installDir, LauncherFileName));
                key.SetValue("UninstallString", "\"" + uninstallerPath + "\" /uninstall");
                key.SetValue("QuietUninstallString", "\"" + uninstallerPath + "\" /uninstall /quiet");
                key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                key.SetValue("EstimatedSize", 1024, RegistryValueKind.DWord);
            }
        }

        public static void DeleteRegistryKey()
        {
            try { Registry.CurrentUser.DeleteSubKeyTree(UninstallKeyPath, false); } catch { }
        }
    }

    internal sealed class InstallerForm : Form
    {
        private readonly Panel content = new Panel();
        private readonly Button backButton = new Button();
        private readonly Button nextButton = new Button();
        private readonly Button cancelButton = new Button();
        private readonly TextBox installPathBox = new TextBox();
        private readonly CheckBox desktopShortcutBox = new CheckBox();
        private readonly CheckBox startMenuShortcutBox = new CheckBox();
        private readonly ProgressBar progressBar = new ProgressBar();
        private readonly Label statusLabel = new Label();
        private int pageIndex;
        private string installedLauncher = "";

        public InstallerForm()
        {
            Text = InstallerShared.AppName + " \u5b89\u88c5\u7a0b\u5e8f";
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = true;
            ClientSize = new Size(720, 460);
            BackColor = Color.White;
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);

            var header = new Panel { Dock = DockStyle.Top, Height = 92, BackColor = Color.FromArgb(255, 248, 244) };
            header.Controls.Add(new Label
            {
                Text = InstallerShared.AppName,
                Font = InstallerShared.UiFont(24, FontStyle.Bold),
                ForeColor = Color.FromArgb(178, 31, 48),
                AutoSize = true,
                Left = 34,
                Top = 20
            });
            header.Controls.Add(new Label
            {
                Text = "Windows \u672c\u5730\u5ba2\u6237\u7aef\u5b89\u88c5\u5411\u5bfc",
                Font = InstallerShared.UiFont(10),
                ForeColor = Color.FromArgb(99, 116, 139),
                AutoSize = true,
                Left = 38,
                Top = 60
            });
            Controls.Add(header);

            content.Dock = DockStyle.Fill;
            content.Padding = new Padding(38, 28, 38, 20);
            Controls.Add(content);

            var footer = new Panel { Dock = DockStyle.Bottom, Height = 70, BackColor = Color.FromArgb(248, 250, 252) };
            backButton.Text = "\u4e0a\u4e00\u6b65";
            backButton.Width = 96;
            backButton.Height = 34;
            backButton.Left = 392;
            backButton.Top = 18;
            backButton.Click += delegate { pageIndex = Math.Max(0, pageIndex - 1); RenderPage(); };
            nextButton.Text = "\u4e0b\u4e00\u6b65";
            nextButton.Width = 96;
            nextButton.Height = 34;
            nextButton.Left = 498;
            nextButton.Top = 18;
            nextButton.Click += delegate { HandleNext(); };
            cancelButton.Text = "\u53d6\u6d88";
            cancelButton.Width = 86;
            cancelButton.Height = 34;
            cancelButton.Left = 604;
            cancelButton.Top = 18;
            cancelButton.Click += delegate { Close(); };
            footer.Controls.Add(backButton);
            footer.Controls.Add(nextButton);
            footer.Controls.Add(cancelButton);
            Controls.Add(footer);

            installPathBox.Text = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SchoolSystem");
            desktopShortcutBox.Text = "\u521b\u5efa\u684c\u9762\u5feb\u6377\u65b9\u5f0f";
            desktopShortcutBox.Checked = true;
            startMenuShortcutBox.Text = "\u521b\u5efa\u5f00\u59cb\u83dc\u5355\u5feb\u6377\u65b9\u5f0f";
            startMenuShortcutBox.Checked = true;
            RenderPage();
        }

        private void RenderPage()
        {
            content.Controls.Clear();
            backButton.Enabled = pageIndex > 0 && pageIndex < 2;
            cancelButton.Enabled = pageIndex < 3;
            nextButton.Enabled = true;
            if (pageIndex == 0) RenderWelcome();
            else if (pageIndex == 1) RenderOptions();
            else if (pageIndex == 2) RenderInstalling();
            else RenderFinished();
        }

        private void RenderWelcome()
        {
            nextButton.Text = "\u4e0b\u4e00\u6b65";
            AddHeading("\u6b22\u8fce\u5b89\u88c5\u6821\u8861\u53f0 Windows \u5ba2\u6237\u7aef");
            AddParagraph("\u6b64\u5411\u5bfc\u4f1a\u628a\u5ba2\u6237\u7aef\u5b89\u88c5\u5230\u672c\u673a\uff0c\u5e76\u521b\u5efa\u53ef\u76f4\u63a5\u6253\u5f00\u7cfb\u7edf\u7684\u672c\u5730\u5165\u53e3\u3002");
            AddParagraph("\u5b89\u88c5\u5b8c\u6210\u540e\uff0c\u4f60\u53ef\u4ee5\u4ece\u684c\u9762\u6216\u5f00\u59cb\u83dc\u5355\u542f\u52a8\u6821\u8861\u53f0\u3002");
        }

        private void RenderOptions()
        {
            nextButton.Text = "\u5b89\u88c5";
            AddHeading("\u9009\u62e9\u5b89\u88c5\u4f4d\u7f6e");
            var pathLabel = new Label { Text = "\u5b89\u88c5\u76ee\u5f55", AutoSize = true, Left = 0, Top = 78, Font = InstallerShared.UiFont(10) };
            installPathBox.Left = 0;
            installPathBox.Top = 104;
            installPathBox.Width = 500;
            installPathBox.Height = 28;
            var browseButton = new Button { Text = "\u6d4f\u89c8...", Left = 514, Top = 102, Width = 88, Height = 30 };
            browseButton.Click += delegate
            {
                using (var dialog = new FolderBrowserDialog())
                {
                    dialog.Description = "\u9009\u62e9\u6821\u8861\u53f0\u5b89\u88c5\u76ee\u5f55";
                    dialog.SelectedPath = installPathBox.Text;
                    if (dialog.ShowDialog(this) == DialogResult.OK) installPathBox.Text = dialog.SelectedPath;
                }
            };
            desktopShortcutBox.Left = 0;
            desktopShortcutBox.Top = 160;
            desktopShortcutBox.Width = 260;
            startMenuShortcutBox.Left = 0;
            startMenuShortcutBox.Top = 190;
            startMenuShortcutBox.Width = 300;
            content.Controls.Add(pathLabel);
            content.Controls.Add(installPathBox);
            content.Controls.Add(browseButton);
            content.Controls.Add(desktopShortcutBox);
            content.Controls.Add(startMenuShortcutBox);
        }

        private void RenderInstalling()
        {
            nextButton.Enabled = false;
            backButton.Enabled = false;
            cancelButton.Enabled = false;
            AddHeading("\u6b63\u5728\u5b89\u88c5");
            progressBar.Left = 0;
            progressBar.Top = 102;
            progressBar.Width = 610;
            progressBar.Height = 24;
            progressBar.Minimum = 0;
            progressBar.Maximum = 100;
            progressBar.Value = 8;
            statusLabel.Left = 0;
            statusLabel.Top = 140;
            statusLabel.Width = 610;
            statusLabel.Height = 28;
            statusLabel.Text = "\u6b63\u5728\u51c6\u5907\u5b89\u88c5\u76ee\u5f55...";
            statusLabel.ForeColor = Color.FromArgb(71, 85, 105);
            statusLabel.Font = InstallerShared.UiFont(10);
            content.Controls.Add(progressBar);
            content.Controls.Add(statusLabel);
            BeginInvoke(new Action(Install));
        }

        private void RenderFinished()
        {
            nextButton.Text = "\u5b8c\u6210";
            backButton.Enabled = false;
            cancelButton.Enabled = false;
            AddHeading("\u5b89\u88c5\u5b8c\u6210");
            AddParagraph("\u6821\u8861\u53f0 Windows \u5ba2\u6237\u7aef\u5df2\u5b89\u88c5\u5230\u672c\u673a\u3002");
            AddParagraph("\u70b9\u51fb\u201c\u5b8c\u6210\u201d\u540e\u5c06\u81ea\u52a8\u6253\u5f00\u5ba2\u6237\u7aef\u3002");
        }

        private void HandleNext()
        {
            if (pageIndex == 1 && string.IsNullOrWhiteSpace(installPathBox.Text))
            {
                MessageBox.Show(this, "\u8bf7\u9009\u62e9\u5b89\u88c5\u76ee\u5f55\u3002", InstallerShared.AppName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            if (pageIndex == 3)
            {
                LaunchInstalledClient();
                Close();
                return;
            }
            pageIndex += 1;
            RenderPage();
        }

        private void Install()
        {
            try
            {
                var installDir = installPathBox.Text.Trim();
                Directory.CreateDirectory(installDir);
                progressBar.Value = 28;
                statusLabel.Text = "\u6b63\u5728\u590d\u5236\u5ba2\u6237\u7aef\u6587\u4ef6...";
                installedLauncher = Path.Combine(installDir, InstallerShared.LauncherFileName);
                var uninstallerPath = Path.Combine(installDir, InstallerShared.UninstallerFileName);
                using (var input = Assembly.GetExecutingAssembly().GetManifestResourceStream(InstallerShared.LauncherResourceName))
                {
                    if (input == null) throw new InvalidOperationException("\u5b89\u88c5\u5305\u5185\u7f3a\u5c11\u5ba2\u6237\u7aef\u6587\u4ef6\u3002");
                    using (var output = File.Create(installedLauncher)) input.CopyTo(output);
                }
                File.Copy(Application.ExecutablePath, uninstallerPath, true);
                progressBar.Value = 64;
                statusLabel.Text = "\u6b63\u5728\u521b\u5efa\u5feb\u6377\u65b9\u5f0f...";
                if (desktopShortcutBox.Checked)
                {
                    var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    InstallerShared.CreateShortcut(Path.Combine(desktop, InstallerShared.AppName + ".lnk"), installedLauncher);
                }
                if (startMenuShortcutBox.Checked)
                {
                    var startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", InstallerShared.AppName);
                    Directory.CreateDirectory(startMenu);
                    InstallerShared.CreateShortcut(Path.Combine(startMenu, InstallerShared.AppName + ".lnk"), installedLauncher);
                }
                InstallerShared.RegisterUninstaller(installDir, uninstallerPath);
                progressBar.Value = 100;
                statusLabel.Text = "\u5b89\u88c5\u5b8c\u6210\u3002";
                pageIndex = 3;
                RenderPage();
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, "\u5b89\u88c5\u5931\u8d25\uff1a\n" + ex.Message, InstallerShared.AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                pageIndex = 1;
                RenderPage();
            }
        }

        private void LaunchInstalledClient()
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(installedLauncher) && File.Exists(installedLauncher))
                    Process.Start(new ProcessStartInfo(installedLauncher) { UseShellExecute = true });
            }
            catch { }
        }

        private void AddHeading(string text)
        {
            content.Controls.Add(new Label
            {
                Text = text,
                AutoSize = true,
                Left = 0,
                Top = 0,
                Font = InstallerShared.UiFont(18, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42)
            });
        }

        private void AddParagraph(string text)
        {
            var count = content.Controls.Count;
            content.Controls.Add(new Label
            {
                Text = text,
                Left = 2,
                Top = 70 + (count - 1) * 34,
                Width = 610,
                Height = 28,
                Font = InstallerShared.UiFont(10),
                ForeColor = Color.FromArgb(71, 85, 105)
            });
        }
    }

    internal sealed class UninstallerForm : Form
    {
        private readonly ProgressBar progressBar = new ProgressBar();
        private readonly Label statusLabel = new Label();
        private readonly Button actionButton = new Button();
        private string installDir = "";

        public UninstallerForm()
        {
            Text = InstallerShared.AppName + " \u5378\u8f7d\u7a0b\u5e8f";
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            ClientSize = new Size(620, 300);
            BackColor = Color.White;
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            Controls.Add(new Label
            {
                Text = "\u5378\u8f7d\u6821\u8861\u53f0 Windows \u5ba2\u6237\u7aef",
                Font = InstallerShared.UiFont(18, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42),
                AutoSize = true,
                Left = 32,
                Top = 30
            });
            Controls.Add(new Label
            {
                Text = "\u6b64\u64cd\u4f5c\u4f1a\u5220\u9664\u672c\u673a\u5ba2\u6237\u7aef\u6587\u4ef6\u3001\u684c\u9762\u5feb\u6377\u65b9\u5f0f\u3001\u5f00\u59cb\u83dc\u5355\u5165\u53e3\u548c\u7cfb\u7edf\u5378\u8f7d\u8bb0\u5f55\u3002",
                Font = InstallerShared.UiFont(10),
                ForeColor = Color.FromArgb(71, 85, 105),
                Width = 540,
                Height = 42,
                Left = 34,
                Top = 78
            });
            progressBar.Left = 34;
            progressBar.Top = 140;
            progressBar.Width = 540;
            progressBar.Height = 22;
            progressBar.Visible = false;
            statusLabel.Left = 34;
            statusLabel.Top = 174;
            statusLabel.Width = 540;
            statusLabel.Height = 26;
            statusLabel.Font = InstallerShared.UiFont(10);
            statusLabel.ForeColor = Color.FromArgb(71, 85, 105);
            actionButton.Text = "\u5f00\u59cb\u5378\u8f7d";
            actionButton.Left = 454;
            actionButton.Top = 232;
            actionButton.Width = 120;
            actionButton.Height = 34;
            actionButton.Click += StartUninstall;
            Controls.Add(progressBar);
            Controls.Add(statusLabel);
            Controls.Add(actionButton);
            installDir = InstallerShared.ReadInstallLocation();
        }

        private void StartUninstall(object sender, EventArgs e)
        {
            actionButton.Enabled = false;
            progressBar.Visible = true;
            progressBar.Value = 12;
            statusLabel.Text = "\u6b63\u5728\u5378\u8f7d...";
            BeginInvoke(new Action(Uninstall));
        }

        private void Uninstall()
        {
            try
            {
                if (string.IsNullOrWhiteSpace(installDir)) installDir = AppDomain.CurrentDomain.BaseDirectory;
                progressBar.Value = 35;
                TryDeleteFile(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), InstallerShared.AppName + ".lnk"));
                var startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", InstallerShared.AppName);
                TryDeleteFile(Path.Combine(startMenu, InstallerShared.AppName + ".lnk"));
                TryDeleteDirectory(startMenu);
                progressBar.Value = 65;
                InstallerShared.DeleteRegistryKey();
                progressBar.Value = 82;
                if (Directory.Exists(installDir))
                {
                    foreach (var file in Directory.GetFiles(installDir))
                    {
                        if (!StringComparer.OrdinalIgnoreCase.Equals(file, Application.ExecutablePath)) TryDeleteFile(file);
                    }
                }
                ScheduleSelfCleanup(installDir);
                progressBar.Value = 100;
                statusLabel.Text = "\u5378\u8f7d\u5b8c\u6210\u3002";
                actionButton.Text = "\u5b8c\u6210";
                actionButton.Click -= StartUninstall;
                actionButton.Click += delegate { Close(); };
                actionButton.Enabled = true;
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, "\u5378\u8f7d\u5931\u8d25\uff1a\n" + ex.Message, InstallerShared.AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                actionButton.Enabled = true;
            }
        }

        private static void TryDeleteFile(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); } catch { }
        }

        private static void TryDeleteDirectory(string path)
        {
            try { if (Directory.Exists(path)) Directory.Delete(path, false); } catch { }
        }

        private static void ScheduleSelfCleanup(string directory)
        {
            try
            {
                var exe = Application.ExecutablePath;
                var command = "/c ping 127.0.0.1 -n 3 > nul & del /f /q \"" + exe + "\"";
                if (!string.IsNullOrWhiteSpace(directory)) command += " & rmdir /q \"" + directory + "\"";
                Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = command,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    UseShellExecute = false
                });
            }
            catch { }
        }
    }
}
