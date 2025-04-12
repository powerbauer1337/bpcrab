powershell
# setup.ps1: One-Click Installer for beatportdl

# --- Configuration ---
$projectName = "beatportdl"
$projectZipUrl = "https://www.dropbox.com/scl/fi/6l7066k9i20c0957c1156/beatportdl.zip?rlkey=o984t6l96i5x0j1l7e8b4q9l3&dl=1"  # URL to download the project's ZIP file
$tempDir = "$env:TEMP\$projectName"
$logFile = "$tempDir\setup.log"

# --- Helper Functions ---

# Log a message
function Write-Log($message, $type = "Info") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$type] $message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

# Download a file
function Download-File($url, $destination) {
    Write-Log "Downloading $url to $destination..."
    try {
        $client = New-Object System.Net.WebClient
        $client.DownloadFile($url, $destination)
        Write-Log "Download complete."
        return $true
    } catch {
        Write-Log "Error downloading file: $_" -type Error
        return $false
    }
}

# Extract a ZIP file
function Expand-ZipFile($zipFile, $destination) {
    Write-Log "Extracting '$zipFile' to '$destination'..."
    try {
        Expand-Archive -Path $zipFile -DestinationPath $destination -Force
        Write-Log "Extraction complete."
        return $true
    } catch {
        Write-Log "Error extracting ZIP file: $_" -type Error
        return $false
    }
}

# Run a PowerShell script
function Run-PowerShellScript($scriptPath) {
    Write-Log "Running PowerShell script: '$scriptPath'..."
    try {
        & powershell.exe -ExecutionPolicy Bypass -File $scriptPath
        Write-Log "PowerShell script completed."
        return $true
    } catch {
        Write-Log "Error running PowerShell script: $_" -type Error
        return $false
    }
}
# Remove item
function Remove-ItemForce($item) {
    Write-Log "Removing item '$item'..."
    try {
        Remove-Item -Path $item -Force -Recurse
        Write-Log "Item removed."
        return $true
    } catch {
        Write-Log "Error removing item: $_" -type Error
        return $false
    }
}

# --- Main Script ---

# Create temp directory
Write-Log "Creating temporary directory: '$tempDir'..."
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Log "Temporary directory created."

# 1. Download the project ZIP
$zipFile = "$tempDir\$projectName.zip"
if (!(Download-File -url $projectZipUrl -destination $zipFile)) {
    Write-Log "Setup failed: Could not download project ZIP." -type Error
    exit 1
}

# 2. Extract the project ZIP
if (!(Expand-ZipFile -zipFile $zipFile -destination $tempDir)) {
    Write-Log "Setup failed: Could not extract project ZIP." -type Error
    exit 1
}

# 3. Run install.ps1
$installScript = "$tempDir\$projectName\install.ps1" # Adjust this path if your extracted folder has a different name
if (!(Run-PowerShellScript -scriptPath $installScript)) {
    Write-Log "Setup failed: install.ps1 did not complete successfully." -type Error
    exit 1
}

# 4. Cleanup
Write-Log "Cleaning up temporary files..."
Remove-ItemForce -item $zipFile
Remove-ItemForce -item "$tempDir\$projectName\install.ps1"
Remove-ItemForce -item "$tempDir\$projectName\install.iss"
Remove-ItemForce -item $tempDir

Write-Log "Setup completed successfully."
