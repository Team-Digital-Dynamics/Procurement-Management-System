$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080'

function Login($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  return (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body $body).token
}

function AuthH($token) {
  return @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json'; Accept = 'application/json' }
}

$requesterToken = Login 'requester@digitaldynamics.co.za' 'Password123!'
$approverToken = Login 'approver1@digitaldynamics.co.za' 'Password123!'
$procToken = Login 'procurement@digitaldynamics.co.za' 'Password123!'
$recvToken = Login 'receiving@digitaldynamics.co.za' 'Password123!'

$reqBody = @{
  title = "CLI End2End Req $(Get-Date -Format 'yyyyMMddHHmmss')"
  businessJustification = 'CLI full trigger'
  items = @(@{ description = 'Workstation'; quantity = 2; estimatedUnitPrice = 9500.00 })
} | ConvertTo-Json -Depth 6

$req = Invoke-RestMethod -Method Post -Uri "$base/api/requisitions" -Headers (AuthH $requesterToken) -Body $reqBody
$reqId = $req.id
Invoke-RestMethod -Method Post -Uri "$base/api/requisitions/$reqId/submit" -Headers (AuthH $requesterToken) | Out-Null

$approvals = Invoke-RestMethod -Method Get -Uri "$base/api/approvals" -Headers (AuthH $approverToken)
$ap = $approvals | Where-Object { $_.requisitionId -eq $reqId } | Select-Object -First 1
if (-not $ap) { throw "Approval not found for req $reqId" }
$apBody = @{ decision = 'APPROVED'; comments = 'CLI full trigger' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/approvals/$($ap.id)/decision" -Headers (AuthH $approverToken) -Body $apBody | Out-Null

$rfqBody = @{
  requisitionId = [int64]$reqId
  submissionDeadline = (Get-Date).ToUniversalTime().AddDays(4).ToString('yyyy-MM-ddTHH:mm:ssZ')
  supplierIds = @(9101, 9102)
  priceWeight = 40
  deliveryWeight = 20
  qualityWeight = 20
  termsWeight = 10
  performanceWeight = 10
} | ConvertTo-Json -Depth 6

$rfq = Invoke-RestMethod -Method Post -Uri "$base/api/rfqs" -Headers (AuthH $procToken) -Body $rfqBody
$rfqId = $rfq.id

$q1Body = @{ rfqId = [int64]$rfqId; supplierId = 9101; totalAmount = 35200.00; deliveryDays = 5; qualityScore = 88; termsScore = 80 } | ConvertTo-Json
$q2Body = @{ rfqId = [int64]$rfqId; supplierId = 9102; totalAmount = 36500.00; deliveryDays = 4; qualityScore = 85; termsScore = 82 } | ConvertTo-Json
$q1 = Invoke-RestMethod -Method Post -Uri "$base/api/quotations" -Headers (AuthH $procToken) -Body $q1Body
$q2 = Invoke-RestMethod -Method Post -Uri "$base/api/quotations" -Headers (AuthH $procToken) -Body $q2Body

Invoke-RestMethod -Method Post -Uri "$base/api/rfqs/$rfqId/evaluate" -Headers (AuthH $procToken) | Out-Null

$awardBody = @{ quotationId = [int64]$q1.id } | ConvertTo-Json
$po = Invoke-RestMethod -Method Post -Uri "$base/api/awards" -Headers (AuthH $procToken) -Body $awardBody
$poId = $po.id

$grnBody = @{ purchaseOrderId = [int64]$poId; receivedValue = 34000.00; notes = 'CLI discrepancy to trigger GRN' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/grns" -Headers (AuthH $recvToken) -Body $grnBody | Out-Null

Write-Output "full-triggered req=$reqId approval=$($ap.id) rfq=$rfqId q1=$($q1.id) q2=$($q2.id) po=$poId"
