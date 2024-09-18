Write-Warning "Creating ETL Scheduled Task"
# Task parameters
$TaskName = "Community Reporting ETL Local"
$TaskDescription = "ETL process for Community Reporting Local"
$TaskAuthor = "Administrator" # This line is not used, but you can keep it for reference
$TaskRunAs = "NT AUTHORITY\SYSTEM"  # Replace with your service account
$TaskRepeatInterval = (New-TimeSpan -Hours 24)  # Repeat task every 24 hours
$TaskExecutable = "C:\CommunityLocal\ReportingETL\ETL\ReportingETL.exe"  # Verify the correct path

# Create a new scheduled task action
$Action = New-ScheduledTaskAction -Execute $TaskExecutable

# Create a trigger for the task
Write-Warning "Create a trigger for the task"
$StartTime = (Get-Date).AddMinutes(1)  # Start the task 1 minute from now
$Trigger = New-ScheduledTaskTrigger -Once -At $StartTime -RepetitionInterval $TaskRepeatInterval -RepetitionDuration (New-TimeSpan -Days 365)
Write-Host "Trigger value: $Trigger"  # Print the trigger value for verification

# Register the scheduled task
Write-Warning "Register the scheduled task"
Register-ScheduledTask -TaskName $TaskName `
                       -Description $TaskDescription `
                       -Action $Action `
                       -Trigger $Trigger `
                       -RunLevel Highest `
                       -User $TaskRunAs `
                       -Force
Write-Warning "ETL Scheduled Task creation completed"

# Start the scheduled task
Write-Warning "Start the ETL scheduled task"
Start-ScheduledTask -TaskName $TaskName
Write-Warning "ETL scheduled task started"