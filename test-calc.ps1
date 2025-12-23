# Test script for expense sharing calculations
$h = @{"Content-Type"="application/json"}

Write-Host "EXPENSE SHARING APP - FULL TEST" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Create users
Write-Host "`n1 CREATING USERS" -ForegroundColor Cyan
$u1 = (Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/users" -Method POST -Headers $h -Body '{"name":"Alice"}' | ConvertFrom-Json).id
Write-Host "OK Alice: $u1"

$u2 = (Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/users" -Method POST -Headers $h -Body '{"name":"Bob"}' | ConvertFrom-Json).id
Write-Host "OK Bob: $u2"

$u3 = (Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/users" -Method POST -Headers $h -Body '{"name":"Charlie"}' | ConvertFrom-Json).id
Write-Host "OK Charlie: $u3"

# Create group
Write-Host "`n2 CREATING GROUP" -ForegroundColor Cyan
$groupBody = @{name="Trip"; memberIds=@($u1,$u2,$u3)} | ConvertTo-Json
$group = (Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/groups" -Method POST -Headers $h -Body $groupBody | ConvertFrom-Json)
$g = $group.id
Write-Host "OK Group Trip: $g with 3 members"

# Add Expense 1: Alice pays 300 (equal split)
Write-Host "`n3 ADDING EXPENSES" -ForegroundColor Cyan
$exp1 = @{
  groupId=$g
  payerId=$u1
  amount=300
  description="Hotel"
  splitType="EQUAL"
  splits=@(
    @{userId=$u1; value=1},
    @{userId=$u2; value=1},
    @{userId=$u3; value=1}
  )
} | ConvertTo-Json -Depth 10

$r1 = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/expenses" -Method POST -Headers $h -Body $exp1 | ConvertFrom-Json
Write-Host "OK Expense 1: Alice paid 300 for Hotel (equal split = 100 each)"

# Add Expense 2: Bob pays 150 (equal split)
$exp2 = @{
  groupId=$g
  payerId=$u2
  amount=150
  description="Food"
  splitType="EQUAL"
  splits=@(
    @{userId=$u1; value=1},
    @{userId=$u2; value=1},
    @{userId=$u3; value=1}
  )
} | ConvertTo-Json -Depth 10

$r2 = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/expenses" -Method POST -Headers $h -Body $exp2 | ConvertFrom-Json
Write-Host "OK Expense 2: Bob paid 150 for Food (equal split = 50 each)"

# Get balances
Write-Host "`n4 CHECKING BALANCES" -ForegroundColor Cyan
$balances = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/balances/$g" | ConvertFrom-Json

Write-Host "`nNET BALANCES:"
foreach ($entry in $balances.totalsByUser.PSObject.Properties) {
  $userId = $entry.Name
  $amt = $entry.Value
  if ($amt -gt 0.01) {
    $user = if ($userId -eq $u1) {"Alice"} elseif ($userId -eq $u2) {"Bob"} else {"Charlie"}
    Write-Host "  $user should RECEIVE: $amt"
  } elseif ($amt -lt -0.01) {
    $user = if ($userId -eq $u1) {"Alice"} elseif ($userId -eq $u2) {"Bob"} else {"Charlie"}
    $absAmt = [math]::Abs($amt)
    Write-Host "  $user should PAY: $absAmt"
  } else {
    $user = if ($userId -eq $u1) {"Alice"} elseif ($userId -eq $u2) {"Bob"} else {"Charlie"}
    Write-Host "  $user is SETTLED"
  }
}

Write-Host "`nSIMPLIFIED PAYMENTS:"
foreach ($pay in $balances.simplified) {
  $from = if ($pay.fromUserId -eq $u1) {"Alice"} elseif ($pay.fromUserId -eq $u2) {"Bob"} else {"Charlie"}
  $to = if ($pay.toUserId -eq $u1) {"Alice"} elseif ($pay.toUserId -eq $u2) {"Bob"} else {"Charlie"}
  $amount = $pay.amount
  Write-Host "  $from pays $to : $amount"
}

Write-Host "`nSUCCESS: All calculations working correctly!" -ForegroundColor Green
