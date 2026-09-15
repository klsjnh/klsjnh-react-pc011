$json = Get-Content 'docs/swagger-live.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$paths = $json.paths.PSObject.Properties.Name
$paths | ForEach-Object { Write-Output $_ }
