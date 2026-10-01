import type { IacBundle } from './model';
import { armRanges, fillCount, fullFrom, starterFrom } from './iacText';

/**
 * The Azure capstone's infrastructure as code (R87): ONE ARM template that
 * describes the company's final environment (Week 12), authored with
 * `⟦FILL:hint|value⟧` markers. The reference template and the Week 9 starter
 * are both derived from this source, so they cannot drift apart.
 *
 * Every resource carries `"comments": "[wN] <node> — …"` — the week it arrives
 * and the diagram node that draws it. The diagram, the week filter and the
 * parity tests all read those tags; nothing restates them.
 *
 * Soundness choices, stated in the course too:
 *  - no SSH from the internet: the app subnet admits SSH only from the
 *    management subnet (reserved for a future Bastion); day-to-day admin is
 *    Run Command, which needs no open port;
 *  - Windows Consumption plan for the Function App — the plan that supports
 *    editing code in the portal, which Week 3 relies on;
 *  - the Function reaches Cosmos DB with its managed identity (no key in any
 *    setting); the vault is infrastructure, secret VALUES never live here;
 *  - storage is HTTPS-only with TLS 1.2 and no anonymous blob access (the
 *    static-website endpoint still serves the site).
 */

const SOURCE = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "metadata": {
    "description": "Capstone IT Services company - the whole environment, as code."
  },
  "parameters": {
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]",
      "metadata": { "description": "Region for every resource. Defaults to the resource group's." }
    },
    "teamId": {
      "type": "string",
      "maxLength": 8,
      "metadata": { "description": "Your team, lowercase, e.g. team01. Goes into every name." }
    },
    "environment": {
      "type": "string",
      "allowedValues": [ "dev", "prod" ],
      "defaultValue": "dev"
    },
    "ownerTag": {
      "type": "string",
      "metadata": { "description": "Who answers for these resources. Required by the Week 11 tag policy." }
    },
    "alertEmail": {
      "type": "string",
      "metadata": { "description": "Where the budget and the error alert send email." }
    },
    "adminUsername": {
      "type": "string",
      "defaultValue": "azureuser"
    },
    "sshPublicKey": {
      "type": "string",
      "metadata": { "description": "Your SSH PUBLIC key. The VM has no password login." }
    },
    "vmSize": {
      "type": "string",
      "defaultValue": "⟦FILL:the free-tier VM size|Standard_B1s⟧"
    },
    "budgetAmount": {
      "type": "int",
      "defaultValue": 5,
      "metadata": { "description": "Monthly budget in your billing currency." }
    },
    "budgetStartDate": {
      "type": "string",
      "defaultValue": "[utcNow('yyyy-MM-01')]",
      "metadata": { "description": "First day of the budget month." }
    },
    "readerGroupObjectId": {
      "type": "string",
      "defaultValue": "",
      "metadata": { "description": "Optional: an Entra group given Reader on the resource group (Week 5)." }
    },
    "throughWeek": {
      "type": "int",
      "defaultValue": 12,
      "allowedValues": [ 4, 8, 12 ],
      "metadata": { "description": "Deploy the environment as it stands at the end of this week: 4 (Fundamentals), 8 (Administrator) or 12 (everything)." }
    }
  },
  "variables": {
    "suffix": "[take(uniqueString(resourceGroup().id), 6)]",
    "tags": {
      "project": "capstone",
      "team": "[parameters('teamId')]",
      "env": "[parameters('environment')]",
      "owner": "[parameters('ownerTag')]"
    },
    "vnetName": "[format('vnet-capstone-{0}', parameters('teamId'))]",
    "snetAppName": "snet-app",
    "snetMgmtName": "snet-mgmt",
    "nsgAppName": "[format('nsg-snet-app-{0}', parameters('teamId'))]",
    "nsgMgmtName": "[format('nsg-snet-mgmt-{0}', parameters('teamId'))]",
    "pipName": "[format('pip-vm-tools-{0}', parameters('teamId'))]",
    "nicName": "[format('nic-vm-tools-{0}', parameters('teamId'))]",
    "vmName": "[format('vm-tools-{0}', parameters('teamId'))]",
    "dataDiskName": "[format('disk-data-tools-{0}', parameters('teamId'))]",
    "webStorageName": "[toLower(format('stweb{0}{1}', parameters('teamId'), variables('suffix')))]",
    "webBlobServiceName": "[format('{0}/default', variables('webStorageName'))]",
    "funcStorageName": "[toLower(format('stfn{0}{1}', parameters('teamId'), variables('suffix')))]",
    "planName": "[format('asp-capstone-{0}', parameters('teamId'))]",
    "funcName": "[format('func-capstone-{0}-{1}', parameters('teamId'), variables('suffix'))]",
    "logName": "[format('log-capstone-{0}', parameters('teamId'))]",
    "appiName": "[format('appi-capstone-{0}', parameters('teamId'))]",
    "cosmosName": "[toLower(format('cosmos-capstone-{0}-{1}', parameters('teamId'), variables('suffix')))]",
    "cosmosDbName": "capstone",
    "cosmosContainerName": "visitors",
    "kvName": "[format('kv-{0}-{1}', parameters('teamId'), variables('suffix'))]",
    "agName": "[format('ag-capstone-{0}', parameters('teamId'))]",
    "alertName": "[format('alert-func-5xx-{0}', parameters('teamId'))]",
    "budgetName": "[format('budget-capstone-{0}', parameters('teamId'))]",
    "snetApp": {
      "name": "[variables('snetAppName')]",
      "properties": {
        "addressPrefix": "⟦FILL:the app subnet range|10.10.1.0/24⟧",
        "networkSecurityGroup": { "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgAppName'))]" }
      }
    },
    "snetMgmt": {
      "name": "[variables('snetMgmtName')]",
      "properties": {
        "addressPrefix": "10.10.2.0/24",
        "networkSecurityGroup": { "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgMgmtName'))]" }
      }
    },
    "dataDisks": [
      {
        "lun": 0,
        "createOption": "Attach",
        "managedDisk": { "id": "[resourceId('Microsoft.Compute/disks', variables('dataDiskName'))]" }
      }
    ],
    "cloudInit": "#cloud-config\\npackages:\\n  - nginx\\nruncmd:\\n  - echo 'IT tools server OK' > /var/www/html/index.html\\n"
  },
  "resources": [
    {
      "comments": "[w1] budget — the $5 guardrail, set before anything can cost money.",
      "type": "Microsoft.Consumption/budgets",
      "apiVersion": "2023-05-01",
      "name": "[variables('budgetName')]",
      "properties": {
        "category": "Cost",
        "amount": "[parameters('budgetAmount')]",
        "timeGrain": "Monthly",
        "timePeriod": { "startDate": "[parameters('budgetStartDate')]" },
        "notifications": {
          "actual-80-percent": {
            "enabled": true,
            "operator": "GreaterThan",
            "threshold": 80,
            "thresholdType": "Actual",
            "contactEmails": [ "[parameters('alertEmail')]" ]
          }
        }
      }
    },
    {
      "comments": "[w2] nsgApp — rules for the app subnet: SSH only from the management subnet, nothing from the internet.",
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-11-01",
      "name": "[variables('nsgAppName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-SSH-From-Mgmt",
            "properties": {
              "priority": 100,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourceAddressPrefix": "⟦FILL:the management subnet range|10.10.2.0/24⟧",
              "sourcePortRange": "*",
              "destinationAddressPrefix": "*",
              "destinationPortRange": "22"
            }
          },
          {
            "name": "Deny-Internet-Inbound",
            "properties": {
              "priority": 4096,
              "direction": "Inbound",
              "access": "Deny",
              "protocol": "*",
              "sourceAddressPrefix": "Internet",
              "sourcePortRange": "*",
              "destinationAddressPrefix": "*",
              "destinationPortRange": "*"
            }
          }
        ]
      }
    },
    {
      "comments": "[w6] nsgMgmt — rules for the management subnet, reserved for a future Bastion.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 6)]",
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-11-01",
      "name": "[variables('nsgMgmtName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "properties": {
        "securityRules": [
          {
            "name": "Deny-Internet-Inbound",
            "properties": {
              "priority": 4096,
              "direction": "Inbound",
              "access": "Deny",
              "protocol": "*",
              "sourceAddressPrefix": "Internet",
              "sourcePortRange": "*",
              "destinationAddressPrefix": "*",
              "destinationPortRange": "*"
            }
          }
        ]
      }
    },
    {
      "comments": "[w1] vnet — the company network: an app subnet now, a management subnet from Week 6.",
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2023-11-01",
      "name": "[variables('vnetName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgAppName'))]",
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgMgmtName'))]"
      ],
      "properties": {
        "addressSpace": { "addressPrefixes": [ "⟦FILL:the VNet address space|10.10.0.0/16⟧" ] },
        "subnets": "[if(greaterOrEquals(parameters('throughWeek'), 6), createArray(variables('snetApp'), variables('snetMgmt')), createArray(variables('snetApp')))]"
      }
    },
    {
      "comments": "[w2] pip — the VM's public address. After Week 6 it only carries outbound traffic (patches).",
      "type": "Microsoft.Network/publicIPAddresses",
      "apiVersion": "2023-11-01",
      "name": "[variables('pipName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Standard", "tier": "Regional" },
      "properties": {
        "publicIPAllocationMethod": "Static",
        "publicIPAddressVersion": "IPv4"
      }
    },
    {
      "comments": "[w2] nic — plugs the VM into the app subnet.",
      "type": "Microsoft.Network/networkInterfaces",
      "apiVersion": "2023-11-01",
      "name": "[variables('nicName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]",
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('pipName'))]"
      ],
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig1",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": { "id": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('vnetName'), variables('snetAppName'))]" },
              "publicIPAddress": { "id": "[resourceId('Microsoft.Network/publicIPAddresses', variables('pipName'))]" }
            }
          }
        ]
      }
    },
    {
      "comments": "[w7] dataDisk — the VM's second disk, for data that must outlive the OS.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 7)]",
      "type": "Microsoft.Compute/disks",
      "apiVersion": "2023-10-02",
      "name": "[variables('dataDiskName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "StandardSSD_LRS" },
      "properties": {
        "creationData": { "createOption": "Empty" },
        "diskSizeGB": 8
      }
    },
    {
      "comments": "[w2] vm — the internal IT tools server: Ubuntu, SSH key only, patched by the platform.",
      "type": "Microsoft.Compute/virtualMachines",
      "apiVersion": "2024-03-01",
      "name": "[variables('vmName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkInterfaces', variables('nicName'))]",
        "[resourceId('Microsoft.Compute/disks', variables('dataDiskName'))]"
      ],
      "properties": {
        "hardwareProfile": { "vmSize": "[parameters('vmSize')]" },
        "storageProfile": {
          "imageReference": {
            "publisher": "Canonical",
            "offer": "0001-com-ubuntu-server-jammy",
            "sku": "22_04-lts-gen2",
            "version": "latest"
          },
          "osDisk": {
            "name": "[format('{0}-osdisk', variables('vmName'))]",
            "createOption": "FromImage",
            "deleteOption": "Delete",
            "managedDisk": { "storageAccountType": "StandardSSD_LRS" }
          },
          "dataDisks": "[if(greaterOrEquals(parameters('throughWeek'), 7), variables('dataDisks'), createArray())]"
        },
        "osProfile": {
          "computerName": "[variables('vmName')]",
          "adminUsername": "[parameters('adminUsername')]",
          "customData": "[base64(variables('cloudInit'))]",
          "linuxConfiguration": {
            "disablePasswordAuthentication": true,
            "ssh": {
              "publicKeys": [
                {
                  "path": "[format('/home/{0}/.ssh/authorized_keys', parameters('adminUsername'))]",
                  "keyData": "[parameters('sshPublicKey')]"
                }
              ]
            },
            "patchSettings": {
              "patchMode": "AutomaticByPlatform",
              "assessmentMode": "AutomaticByPlatform"
            }
          }
        },
        "networkProfile": {
          "networkInterfaces": [ { "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('nicName'))]" } ]
        },
        "diagnosticsProfile": { "bootDiagnostics": { "enabled": true } }
      }
    },
    {
      "comments": "[w2] webStorage — hosts the company website ($web container, HTTPS endpoint built in).",
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-05-01",
      "name": "[variables('webStorageName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Standard_LRS" },
      "kind": "StorageV2",
      "properties": {
        "accessTier": "Hot",
        "supportsHttpsTrafficOnly": true,
        "minimumTlsVersion": "⟦FILL:the minimum TLS version|TLS1_2⟧",
        "allowBlobPublicAccess": false
      }
    },
    {
      "comments": "[w8] webBlobService — soft delete and versioning, so a deleted or overwritten page comes back.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 8)]",
      "type": "Microsoft.Storage/storageAccounts/blobServices",
      "apiVersion": "2023-05-01",
      "name": "[variables('webBlobServiceName')]",
      "dependsOn": [
        "[resourceId('Microsoft.Storage/storageAccounts', variables('webStorageName'))]"
      ],
      "properties": {
        "isVersioningEnabled": true,
        "deleteRetentionPolicy": { "enabled": true, "days": 7 },
        "containerDeleteRetentionPolicy": { "enabled": true, "days": 7 }
      }
    },
    {
      "comments": "[w3] funcStorage — the Function App's own runtime storage, kept apart from the public site.",
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-05-01",
      "name": "[variables('funcStorageName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Standard_LRS" },
      "kind": "StorageV2",
      "properties": {
        "supportsHttpsTrafficOnly": true,
        "minimumTlsVersion": "TLS1_2",
        "allowBlobPublicAccess": false
      }
    },
    {
      "comments": "[w3] log — the Log Analytics workspace every log and metric ends up in.",
      "type": "Microsoft.OperationalInsights/workspaces",
      "apiVersion": "2022-10-01",
      "name": "[variables('logName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "properties": {
        "sku": { "name": "PerGB2018" },
        "retentionInDays": 30
      }
    },
    {
      "comments": "[w3] appi — Application Insights: requests, failures and traces from the Function.",
      "type": "Microsoft.Insights/components",
      "apiVersion": "2020-02-02",
      "name": "[variables('appiName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "kind": "web",
      "dependsOn": [
        "[resourceId('Microsoft.OperationalInsights/workspaces', variables('logName'))]"
      ],
      "properties": {
        "Application_Type": "web",
        "WorkspaceResourceId": "[resourceId('Microsoft.OperationalInsights/workspaces', variables('logName'))]"
      }
    },
    {
      "comments": "[w3] cosmos — the NoSQL database account (serverless: pay per request, no idle cost).",
      "type": "Microsoft.DocumentDB/databaseAccounts",
      "apiVersion": "2024-05-15",
      "name": "[variables('cosmosName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "kind": "GlobalDocumentDB",
      "properties": {
        "databaseAccountOfferType": "Standard",
        "locations": [ { "locationName": "[parameters('location')]", "failoverPriority": 0, "isZoneRedundant": false } ],
        "consistencyPolicy": { "defaultConsistencyLevel": "Session" },
        "capabilities": [ { "name": "EnableServerless" } ],
        "minimalTlsVersion": "Tls12",
        "disableLocalAuth": false,
        "publicNetworkAccess": "Enabled"
      }
    },
    {
      "comments": "[w3] cosmosDb — the database inside the account.",
      "type": "Microsoft.DocumentDB/databaseAccounts/sqlDatabases",
      "apiVersion": "2024-05-15",
      "name": "[format('{0}/{1}', variables('cosmosName'), variables('cosmosDbName'))]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.DocumentDB/databaseAccounts', variables('cosmosName'))]"
      ],
      "properties": { "resource": { "id": "[variables('cosmosDbName')]" } }
    },
    {
      "comments": "[w3] cosmosContainer — holds the visitor counter item (id: site).",
      "type": "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers",
      "apiVersion": "2024-05-15",
      "name": "[format('{0}/{1}/{2}', variables('cosmosName'), variables('cosmosDbName'), variables('cosmosContainerName'))]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.DocumentDB/databaseAccounts/sqlDatabases', variables('cosmosName'), variables('cosmosDbName'))]"
      ],
      "properties": {
        "resource": {
          "id": "[variables('cosmosContainerName')]",
          "partitionKey": { "paths": [ "⟦FILL:the partition key path|/id⟧" ], "kind": "Hash" }
        }
      }
    },
    {
      "comments": "[w5] kv — Key Vault in RBAC mode. The vault is infrastructure; secret values never go in a template.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 5)]",
      "type": "Microsoft.KeyVault/vaults",
      "apiVersion": "2023-07-01",
      "name": "[variables('kvName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "properties": {
        "tenantId": "[subscription().tenantId]",
        "sku": { "family": "A", "name": "standard" },
        "enableRbacAuthorization": true,
        "enableSoftDelete": true,
        "softDeleteRetentionInDays": 7,
        "publicNetworkAccess": "Enabled"
      }
    },
    {
      "comments": "[w3] plan — a Windows Consumption plan: pay per execution, and code can be edited in the portal.",
      "type": "Microsoft.Web/serverfarms",
      "apiVersion": "2023-12-01",
      "name": "[variables('planName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "kind": "functionapp",
      "sku": { "name": "Y1", "tier": "Dynamic" },
      "properties": {}
    },
    {
      "comments": "[w3] func — the visitor-counter API. Its managed identity reaches Cosmos DB; CORS admits only the site.",
      "type": "Microsoft.Web/sites",
      "apiVersion": "2023-12-01",
      "name": "[variables('funcName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "kind": "functionapp",
      "identity": { "type": "SystemAssigned" },
      "dependsOn": [
        "[resourceId('Microsoft.Web/serverfarms', variables('planName'))]",
        "[resourceId('Microsoft.Storage/storageAccounts', variables('funcStorageName'))]",
        "[resourceId('Microsoft.Storage/storageAccounts', variables('webStorageName'))]",
        "[resourceId('Microsoft.Insights/components', variables('appiName'))]",
        "[resourceId('Microsoft.DocumentDB/databaseAccounts', variables('cosmosName'))]"
      ],
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('planName'))]",
        "httpsOnly": true,
        "siteConfig": {
          "minTlsVersion": "1.2",
          "ftpsState": "Disabled",
          "cors": {
            "allowedOrigins": [
              "[substring(reference(resourceId('Microsoft.Storage/storageAccounts', variables('webStorageName')), '2023-05-01').primaryEndpoints.web, 0, sub(length(reference(resourceId('Microsoft.Storage/storageAccounts', variables('webStorageName')), '2023-05-01').primaryEndpoints.web), 1))]"
            ]
          },
          "appSettings": [
            { "name": "AzureWebJobsStorage", "value": "[format('DefaultEndpointsProtocol=https;AccountName={0};EndpointSuffix={1};AccountKey={2}', variables('funcStorageName'), environment().suffixes.storage, listKeys(resourceId('Microsoft.Storage/storageAccounts', variables('funcStorageName')), '2023-05-01').keys[0].value)]" },
            { "name": "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING", "value": "[format('DefaultEndpointsProtocol=https;AccountName={0};EndpointSuffix={1};AccountKey={2}', variables('funcStorageName'), environment().suffixes.storage, listKeys(resourceId('Microsoft.Storage/storageAccounts', variables('funcStorageName')), '2023-05-01').keys[0].value)]" },
            { "name": "WEBSITE_CONTENTSHARE", "value": "[toLower(variables('funcName'))]" },
            { "name": "FUNCTIONS_EXTENSION_VERSION", "value": "~4" },
            { "name": "FUNCTIONS_WORKER_RUNTIME", "value": "⟦FILL:the language runtime|node⟧" },
            { "name": "WEBSITE_NODE_DEFAULT_VERSION", "value": "~20" },
            { "name": "APPLICATIONINSIGHTS_CONNECTION_STRING", "value": "[reference(resourceId('Microsoft.Insights/components', variables('appiName')), '2020-02-02').ConnectionString]" },
            { "name": "CosmosConnection__accountEndpoint", "value": "[reference(resourceId('Microsoft.DocumentDB/databaseAccounts', variables('cosmosName')), '2024-05-15').documentEndpoint]" },
            { "name": "COSMOS_DATABASE", "value": "[variables('cosmosDbName')]" },
            { "name": "COSMOS_CONTAINER", "value": "[variables('cosmosContainerName')]" }
          ]
        }
      }
    },
    {
      "comments": "[w4] funcDiag — sends the Function's logs and metrics to Log Analytics.",
      "type": "Microsoft.Insights/diagnosticSettings",
      "apiVersion": "2021-05-01-preview",
      "name": "send-to-log-analytics",
      "scope": "[resourceId('Microsoft.Web/sites', variables('funcName'))]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/sites', variables('funcName'))]",
        "[resourceId('Microsoft.OperationalInsights/workspaces', variables('logName'))]"
      ],
      "properties": {
        "workspaceId": "[resourceId('Microsoft.OperationalInsights/workspaces', variables('logName'))]",
        "logs": [ { "category": "FunctionAppLogs", "enabled": true } ],
        "metrics": [ { "category": "AllMetrics", "enabled": true } ]
      }
    },
    {
      "comments": "[w4] actionGroup — who gets told when an alert fires.",
      "type": "Microsoft.Insights/actionGroups",
      "apiVersion": "2023-01-01",
      "name": "[variables('agName')]",
      "location": "global",
      "tags": "[variables('tags')]",
      "properties": {
        "groupShortName": "capstone",
        "enabled": true,
        "emailReceivers": [
          { "name": "team-owner", "emailAddress": "[parameters('alertEmail')]", "useCommonAlertSchema": true }
        ]
      }
    },
    {
      "comments": "[w4] http5xxAlert — fires when the API returns a server error.",
      "type": "Microsoft.Insights/metricAlerts",
      "apiVersion": "2018-03-01",
      "name": "[variables('alertName')]",
      "location": "global",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/sites', variables('funcName'))]",
        "[resourceId('Microsoft.Insights/actionGroups', variables('agName'))]"
      ],
      "properties": {
        "description": "The visitor-counter API returned a 5xx.",
        "severity": 2,
        "enabled": true,
        "scopes": [ "[resourceId('Microsoft.Web/sites', variables('funcName'))]" ],
        "evaluationFrequency": "PT5M",
        "windowSize": "PT5M",
        "criteria": {
          "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
          "allOf": [
            {
              "name": "server-errors",
              "criterionType": "StaticThresholdCriterion",
              "metricNamespace": "Microsoft.Web/sites",
              "metricName": "Http5xx",
              "operator": "GreaterThan",
              "threshold": 0,
              "timeAggregation": "Total"
            }
          ]
        },
        "actions": [ { "actionGroupId": "[resourceId('Microsoft.Insights/actionGroups', variables('agName'))]" } ]
      }
    },
    {
      "comments": "[w5] cosmosRoleFunc — lets the Function's identity read and write data. No key needed.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 5)]",
      "type": "Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments",
      "apiVersion": "2024-05-15",
      "name": "[format('{0}/{1}', variables('cosmosName'), guid(resourceGroup().id, variables('funcName'), 'cosmos-data-contributor'))]",
      "dependsOn": [
        "[resourceId('Microsoft.DocumentDB/databaseAccounts', variables('cosmosName'))]",
        "[resourceId('Microsoft.Web/sites', variables('funcName'))]"
      ],
      "properties": {
        "roleDefinitionId": "[resourceId('Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions', variables('cosmosName'), '00000000-0000-0000-0000-000000000002')]",
        "principalId": "[reference(resourceId('Microsoft.Web/sites', variables('funcName')), '2023-12-01', 'full').identity.principalId]",
        "scope": "[resourceId('Microsoft.DocumentDB/databaseAccounts', variables('cosmosName'))]"
      }
    },
    {
      "comments": "[w5] kvRoleFunc — lets the Function's identity read secrets (Key Vault Secrets User), nothing more. By hand, Week 5 moves the key into the vault while the identity takes over the data path.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 5)]",
      "type": "Microsoft.Authorization/roleAssignments",
      "apiVersion": "2022-04-01",
      "name": "[guid(resourceId('Microsoft.KeyVault/vaults', variables('kvName')), variables('funcName'), 'kv-secrets-user')]",
      "scope": "[resourceId('Microsoft.KeyVault/vaults', variables('kvName'))]",
      "dependsOn": [
        "[resourceId('Microsoft.KeyVault/vaults', variables('kvName'))]",
        "[resourceId('Microsoft.Web/sites', variables('funcName'))]"
      ],
      "properties": {
        "roleDefinitionId": "[subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')]",
        "principalId": "[reference(resourceId('Microsoft.Web/sites', variables('funcName')), '2023-12-01', 'full').identity.principalId]",
        "principalType": "ServicePrincipal"
      }
    },
    {
      "comments": "[w3] readerRole — optional: the team's Entra group can look at everything here and change nothing.",
      "condition": "[not(empty(parameters('readerGroupObjectId')))]",
      "type": "Microsoft.Authorization/roleAssignments",
      "apiVersion": "2022-04-01",
      "name": "[guid(resourceGroup().id, parameters('readerGroupObjectId'), 'reader')]",
      "properties": {
        "roleDefinitionId": "[subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')]",
        "principalId": "[parameters('readerGroupObjectId')]",
        "principalType": "Group"
      }
    },
    {
      "comments": "[w11] tagPolicy — Azure Policy refuses any new resource without an owner tag.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 11)]",
      "type": "Microsoft.Authorization/policyAssignments",
      "apiVersion": "2022-06-01",
      "name": "require-owner-tag",
      "properties": {
        "displayName": "Require an owner tag on resources",
        "policyDefinitionId": "/providers/Microsoft.Authorization/policyDefinitions/871b6d14-10aa-478d-b590-94f262ecfa99",
        "parameters": { "tagName": { "value": "owner" } },
        "enforcementMode": "Default"
      }
    }
  ],
  "outputs": {
    "siteUrl": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.Storage/storageAccounts', variables('webStorageName')), '2023-05-01').primaryEndpoints.web]"
    },
    "functionUrl": {
      "type": "string",
      "value": "[format('https://{0}/api/visitorCount', reference(resourceId('Microsoft.Web/sites', variables('funcName')), '2023-12-01').defaultHostName)]"
    },
    "vmPrivateIp": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.Network/networkInterfaces', variables('nicName')), '2023-11-01').ipConfigurations[0].properties.privateIPAddress]"
    },
    "cosmosEndpoint": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.DocumentDB/databaseAccounts', variables('cosmosName')), '2024-05-15').documentEndpoint]"
    },
    "keyVaultUri": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.KeyVault/vaults', variables('kvName')), '2023-07-01').vaultUri]"
    },
    "webStorageAccount": {
      "type": "string",
      "value": "[variables('webStorageName')]"
    }
  }
}
`;

const PARAMS_DEV = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "teamId": { "value": "team01" },
    "environment": { "value": "dev" },
    "ownerTag": { "value": "team01-lead" },
    "alertEmail": { "value": "team01@example.com" },
    "sshPublicKey": { "value": "ssh-ed25519 AAAA...paste-your-public-key" },
    "vmSize": { "value": "Standard_B1s" },
    "budgetAmount": { "value": 5 }
  }
}
`;

const PARAMS_PROD = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "teamId": { "value": "team01" },
    "environment": { "value": "prod" },
    "ownerTag": { "value": "team01-lead" },
    "alertEmail": { "value": "team01@example.com" },
    "sshPublicKey": { "value": "ssh-ed25519 AAAA...paste-your-public-key" },
    "vmSize": { "value": "Standard_B1s" },
    "budgetAmount": { "value": 10 }
  }
}
`;

const FULL = fullFrom(SOURCE);

export const AZURE_IAC: IacBundle = {
  platform: 'azure',
  tool: 'ARM template',
  full: { name: 'azuredeploy.json', lang: 'json', text: FULL },
  starter: { name: 'azuredeploy.starter.json', lang: 'json', text: starterFrom(SOURCE, 'json') },
  fillCount: fillCount(SOURCE),
  parameters: [
    { name: 'azuredeploy.parameters.dev.json', lang: 'json', text: PARAMS_DEV },
    { name: 'azuredeploy.parameters.prod.json', lang: 'json', text: PARAMS_PROD },
  ],
  outputs: [
    { name: 'siteUrl', description: 'The website’s HTTPS address (the static-website endpoint).' },
    { name: 'functionUrl', description: 'The visitor-counter API — goes into config.json.' },
    { name: 'vmPrivateIp', description: 'The IT tools server’s address inside the app subnet.' },
    { name: 'cosmosEndpoint', description: 'The database account’s endpoint (not a secret).' },
    { name: 'keyVaultUri', description: 'The vault’s address, for Key Vault references.' },
    { name: 'webStorageAccount', description: 'Needed once, to switch on the static website.' },
  ],
  resources: armRanges(FULL),
  commands: [
    { label: 'Pick the resource group', cmd: 'RG=rg-capstone-team01' },
    { label: 'Check the template before anything changes', cmd: 'az deployment group validate -g $RG --template-file azuredeploy.json --parameters @azuredeploy.parameters.dev.json' },
    { label: 'Preview exactly what will change', cmd: 'az deployment group what-if -g $RG --template-file azuredeploy.json --parameters @azuredeploy.parameters.dev.json' },
    { label: 'Deploy', cmd: 'az deployment group create -g $RG --template-file azuredeploy.json --parameters @azuredeploy.parameters.dev.json' },
    { label: 'Switch on the static website (ARM cannot)', cmd: 'az storage blob service-properties update --account-name $WEB --static-website --index-document index.html --404-document 404.html --auth-mode login' },
  ],
  notes: [
    'ARM cannot switch on the static-website feature — it is a data-plane setting. One CLI command does it after the deployment.',
    'The Function’s code is not in the template. It ships through the portal in Week 3 and through GitHub Actions from Week 10.',
    'Secret values never live in a template. The vault is created here; you add secrets to it, and the Function reads them with its identity.',
    'The OS disk is Standard SSD: the free account includes two 64 GB Standard SSD disks for twelve months, where a Premium SSD would cost about $5 a month.',
    'Deploy with throughWeek=4 or 8 to get the environment exactly as the Fundamentals or the Administrator course leaves it; every later resource is conditional on it.',
    'The VM keeps a public IP only so it can download patches. Production would use a NAT gateway; this course avoids its monthly cost and opens no inbound port instead.',
  ],
};
