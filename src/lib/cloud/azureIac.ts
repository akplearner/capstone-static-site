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
 *  - nothing inbound from the internet except HTTP to the web subnet, where
 *    the load-balanced fleet lives; the app subnet admits nothing, admin is
 *    Bastion Developer in the browser and Run Command, which need no open port;
 *  - R106: the fleet (a Flexible scale set across two zones behind a Standard
 *    Load Balancer) is parked at `fleetSize` 0 by default, and the
 *    zone-redundant PostgreSQL server only exists when `createDatabase` is
 *    true — both bill by the hour, so the template never starts them unasked;
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
    },
    "githubRepository": {
      "type": "string",
      "defaultValue": "your-org/your-repo",
      "metadata": { "description": "owner/name of the GitHub repository the Week 10 pipeline deploys from — the federated credential trusts exactly this repo's main branch." }
    },
    "fleetSize": {
      "type": "int",
      "defaultValue": 0,
      "minValue": 0,
      "maxValue": 3,
      "metadata": { "description": "Instances in the Week 6 web scale set. 0 parks the fleet (free); autoscale is enabled only when this is above 0." }
    },
    "createDatabase": {
      "type": "bool",
      "defaultValue": false,
      "metadata": { "description": "Create the Week 7 zone-redundant PostgreSQL server (about $0.30 an hour). False by default: the course creates, stops and deletes it by hand." }
    },
    "dbAdminPassword": {
      "type": "securestring",
      "defaultValue": "",
      "metadata": { "description": "The PostgreSQL admin password, required only when createDatabase is true. Pass it on the command line; never write it in a file." }
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
    "snetWebName": "snet-web",
    "snetDbName": "snet-db",
    "nsgAppName": "[format('nsg-snet-app-{0}', parameters('teamId'))]",
    "nsgWebName": "[format('nsg-snet-web-{0}', parameters('teamId'))]",
    "nsgDbName": "[format('nsg-snet-db-{0}', parameters('teamId'))]",
    "lbName": "[format('lb-web-{0}', parameters('teamId'))]",
    "lbPipName": "[format('pip-lb-web-{0}', parameters('teamId'))]",
    "fleetName": "[format('vmss-web-{0}', parameters('teamId'))]",
    "autoscaleName": "[format('autoscale-web-{0}', parameters('teamId'))]",
    "pgName": "[toLower(format('pg-capstone-{0}-{1}', parameters('teamId'), variables('suffix')))]",
    "pgDnsZoneName": "[format('{0}.private.postgres.database.azure.com', variables('pgName'))]",
    "visitsQueueName": "visits",
    "withDatabase": "[and(greaterOrEquals(parameters('throughWeek'), 7), parameters('createDatabase'))]",
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
    "bastionName": "[format('bas-capstone-{0}', parameters('teamId'))]",
    "deployIdentityName": "[format('id-deploy-capstone-{0}', parameters('teamId'))]",
    "snetApp": {
      "name": "[variables('snetAppName')]",
      "properties": {
        "addressPrefix": "⟦FILL:the app subnet range|10.10.1.0/24⟧",
        "networkSecurityGroup": { "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgAppName'))]" }
      }
    },
    "snetWeb": {
      "name": "[variables('snetWebName')]",
      "properties": {
        "addressPrefix": "10.10.2.0/24",
        "networkSecurityGroup": { "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgWebName'))]" }
      }
    },
    "snetDb": {
      "name": "[variables('snetDbName')]",
      "properties": {
        "addressPrefix": "10.10.3.0/24",
        "networkSecurityGroup": { "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgDbName'))]" },
        "delegations": [ { "name": "postgres", "properties": { "serviceName": "Microsoft.DBforPostgreSQL/flexibleServers" } } ]
      }
    },
    "subnets": "[if(greaterOrEquals(parameters('throughWeek'), 7), createArray(variables('snetApp'), variables('snetWeb'), variables('snetDb')), if(greaterOrEquals(parameters('throughWeek'), 6), createArray(variables('snetApp'), variables('snetWeb')), createArray(variables('snetApp'))))]",
    "fleetInit": "#cloud-config\\nruncmd:\\n  - mkdir -p /srv/www\\n  - Z=$(curl -s -H Metadata:true \\"http://169.254.169.254/metadata/instance/compute/zone?api-version=2021-02-01&format=text\\"); echo \\"web OK from zone $Z\\" > /srv/www/index.html\\n  - cd /srv/www && nohup python3 -m http.server 80 >/dev/null 2>&1 &\\n",
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
      "comments": "[w2] nsgApp — rules for the app subnet: nothing inbound from the internet; admin is Bastion and Run Command, which need no port.",
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-11-01",
      "name": "[variables('nsgAppName')]",
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
      "comments": "[w6] nsgWeb — rules for the web subnet: HTTP from the internet to the fleet (the balancer passes the visitor's address through), nothing else.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 6)]",
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-11-01",
      "name": "[variables('nsgWebName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-HTTP-Internet",
            "properties": {
              "priority": 110,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourceAddressPrefix": "Internet",
              "sourcePortRange": "*",
              "destinationAddressPrefix": "*",
              "destinationPortRange": "⟦FILL:the port the fleet serves|80⟧"
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
      "comments": "[w7] nsgDb — rules for the database subnet: PostgreSQL from the app and web subnets only, nothing from the internet.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 7)]",
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-11-01",
      "name": "[variables('nsgDbName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-Postgres-From-VNet",
            "properties": {
              "priority": 100,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourceAddressPrefixes": [ "10.10.1.0/24", "10.10.2.0/24" ],
              "sourcePortRange": "*",
              "destinationAddressPrefix": "*",
              "destinationPortRange": "5432"
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
      "comments": "[w1] vnet — the company network: an app subnet now, the web subnet from Week 6, the database subnet from Week 7.",
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2023-11-01",
      "name": "[variables('vnetName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgAppName'))]",
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgWebName'))]",
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgDbName'))]"
      ],
      "properties": {
        "addressSpace": { "addressPrefixes": [ "⟦FILL:the VNet address space|10.10.0.0/16⟧" ] },
        "subnets": "[variables('subnets')]"
      }
    },
    {
      "comments": "[w2] pip — the VM's public address. From Week 6 nothing inbound reaches it; it only carries outbound traffic (patches).",
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
      "comments": "[w6] lbPip — the balancer's public address, zone-redundant: it survives the loss of any one zone.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 6)]",
      "type": "Microsoft.Network/publicIPAddresses",
      "apiVersion": "2023-11-01",
      "name": "[variables('lbPipName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Standard", "tier": "Regional" },
      "zones": [ "1", "2", "3" ],
      "properties": {
        "publicIPAllocationMethod": "Static",
        "publicIPAddressVersion": "IPv4"
      }
    },
    {
      "comments": "[w6] lb — the Standard Load Balancer: one address, a health probe on /, port 80 to whichever instance answers.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 6)]",
      "type": "Microsoft.Network/loadBalancers",
      "apiVersion": "2023-11-01",
      "name": "[variables('lbName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Standard", "tier": "Regional" },
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('lbPipName'))]"
      ],
      "properties": {
        "frontendIPConfigurations": [
          { "name": "fe", "properties": { "publicIPAddress": { "id": "[resourceId('Microsoft.Network/publicIPAddresses', variables('lbPipName'))]" } } }
        ],
        "backendAddressPools": [ { "name": "bepool" } ],
        "probes": [
          { "name": "http", "properties": { "protocol": "Http", "port": 80, "requestPath": "/", "intervalInSeconds": 5, "probeThreshold": 2 } }
        ],
        "loadBalancingRules": [
          {
            "name": "http",
            "properties": {
              "frontendIPConfiguration": { "id": "[resourceId('Microsoft.Network/loadBalancers/frontendIPConfigurations', variables('lbName'), 'fe')]" },
              "backendAddressPool": { "id": "[resourceId('Microsoft.Network/loadBalancers/backendAddressPools', variables('lbName'), 'bepool')]" },
              "probe": { "id": "[resourceId('Microsoft.Network/loadBalancers/probes', variables('lbName'), 'http')]" },
              "protocol": "Tcp",
              "frontendPort": 80,
              "backendPort": 80,
              "idleTimeoutInMinutes": 4
            }
          }
        ]
      }
    },
    {
      "comments": "[w6] vmss — the web fleet: a Flexible scale set of B1s across zones 1 and 2, no public addresses, parked at fleetSize 0.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 6)]",
      "type": "Microsoft.Compute/virtualMachineScaleSets",
      "apiVersion": "2024-03-01",
      "name": "[variables('fleetName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "zones": [ "1", "2" ],
      "sku": { "name": "[parameters('vmSize')]", "tier": "Standard", "capacity": "[parameters('fleetSize')]" },
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('lbName'))]"
      ],
      "properties": {
        "orchestrationMode": "Flexible",
        "platformFaultDomainCount": 1,
        "virtualMachineProfile": {
          "storageProfile": {
            "imageReference": { "publisher": "Canonical", "offer": "0001-com-ubuntu-server-jammy", "sku": "22_04-lts-gen2", "version": "latest" },
            "osDisk": { "createOption": "FromImage", "deleteOption": "Delete", "managedDisk": { "storageAccountType": "StandardSSD_LRS" } }
          },
          "osProfile": {
            "computerNamePrefix": "web",
            "adminUsername": "[parameters('adminUsername')]",
            "customData": "[base64(variables('fleetInit'))]",
            "linuxConfiguration": {
              "disablePasswordAuthentication": true,
              "ssh": { "publicKeys": [ { "path": "[format('/home/{0}/.ssh/authorized_keys', parameters('adminUsername'))]", "keyData": "[parameters('sshPublicKey')]" } ] }
            }
          },
          "networkProfile": {
            "networkApiVersion": "2020-11-01",
            "networkInterfaceConfigurations": [
              {
                "name": "nic-web",
                "properties": {
                  "primary": true,
                  "ipConfigurations": [
                    {
                      "name": "ipconfig1",
                      "properties": {
                        "subnet": { "id": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('vnetName'), variables('snetWebName'))]" },
                        "loadBalancerBackendAddressPools": [ { "id": "[resourceId('Microsoft.Network/loadBalancers/backendAddressPools', variables('lbName'), 'bepool')]" } ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "comments": "[w8] autoscale — adds an instance above 50% average CPU and removes one below 25%, between one and three; enabled only when the fleet is not parked.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 8)]",
      "type": "Microsoft.Insights/autoscalesettings",
      "apiVersion": "2022-10-01",
      "name": "[variables('autoscaleName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "dependsOn": [
        "[resourceId('Microsoft.Compute/virtualMachineScaleSets', variables('fleetName'))]"
      ],
      "properties": {
        "enabled": "[greater(parameters('fleetSize'), 0)]",
        "targetResourceUri": "[resourceId('Microsoft.Compute/virtualMachineScaleSets', variables('fleetName'))]",
        "profiles": [
          {
            "name": "cpu",
            "capacity": { "minimum": "1", "maximum": "3", "default": "[string(max(parameters('fleetSize'), 1))]" },
            "rules": [
              {
                "metricTrigger": { "metricName": "Percentage CPU", "metricResourceUri": "[resourceId('Microsoft.Compute/virtualMachineScaleSets', variables('fleetName'))]", "timeGrain": "PT1M", "statistic": "Average", "timeWindow": "PT5M", "timeAggregation": "Average", "operator": "GreaterThan", "threshold": 50 },
                "scaleAction": { "direction": "Increase", "type": "ChangeCount", "value": "1", "cooldown": "PT5M" }
              },
              {
                "metricTrigger": { "metricName": "Percentage CPU", "metricResourceUri": "[resourceId('Microsoft.Compute/virtualMachineScaleSets', variables('fleetName'))]", "timeGrain": "PT1M", "statistic": "Average", "timeWindow": "PT5M", "timeAggregation": "Average", "operator": "LessThan", "threshold": 25 },
                "scaleAction": { "direction": "Decrease", "type": "ChangeCount", "value": "1", "cooldown": "PT5M" }
              }
            ]
          }
        ]
      }
    },
    {
      "comments": "[w7] pgDnsZone — the private DNS zone a VNet-integrated PostgreSQL server resolves its name in.",
      "condition": "[variables('withDatabase')]",
      "type": "Microsoft.Network/privateDnsZones",
      "apiVersion": "2020-06-01",
      "name": "[variables('pgDnsZoneName')]",
      "location": "global",
      "tags": "[variables('tags')]"
    },
    {
      "comments": "[w7] pgDnsLink — ties the zone to the company network, so the fleet resolves the server to its private address.",
      "condition": "[variables('withDatabase')]",
      "type": "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
      "apiVersion": "2020-06-01",
      "name": "[format('{0}/link-vnet', variables('pgDnsZoneName'))]",
      "location": "global",
      "dependsOn": [
        "[resourceId('Microsoft.Network/privateDnsZones', variables('pgDnsZoneName'))]",
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]"
      ],
      "properties": {
        "registrationEnabled": false,
        "virtualNetwork": { "id": "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]" }
      }
    },
    {
      "comments": "[w7] pg — Azure Database for PostgreSQL flexible server: zone-redundant HA, encrypted, private in snet-db; created only when createDatabase is true.",
      "condition": "[variables('withDatabase')]",
      "type": "Microsoft.DBforPostgreSQL/flexibleServers",
      "apiVersion": "2024-08-01",
      "name": "[variables('pgName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Standard_D2ds_v4", "tier": "GeneralPurpose" },
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]",
        "[resourceId('Microsoft.Network/privateDnsZones/virtualNetworkLinks', variables('pgDnsZoneName'), 'link-vnet')]"
      ],
      "properties": {
        "version": "16",
        "administratorLogin": "capstone",
        "administratorLoginPassword": "[parameters('dbAdminPassword')]",
        "storage": { "storageSizeGB": 32 },
        "backup": { "backupRetentionDays": 7, "geoRedundantBackup": "Disabled" },
        "availabilityZone": "1",
        "highAvailability": { "mode": "⟦FILL:the HA mode that puts the standby in another zone|ZoneRedundant⟧", "standbyAvailabilityZone": "2" },
        "network": {
          "delegatedSubnetResourceId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('vnetName'), variables('snetDbName'))]",
          "privateDnsZoneArmResourceId": "[resourceId('Microsoft.Network/privateDnsZones', variables('pgDnsZoneName'))]"
        }
      }
    },
    {
      "comments": "[w7] visitsQueue — the storage queue between the counter and the ledger: the API answers now, the write happens when it can.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 7)]",
      "type": "Microsoft.Storage/storageAccounts/queueServices/queues",
      "apiVersion": "2023-05-01",
      "name": "[format('{0}/default/{1}', variables('funcStorageName'), variables('visitsQueueName'))]",
      "dependsOn": [
        "[resourceId('Microsoft.Storage/storageAccounts', variables('funcStorageName'))]"
      ],
      "properties": {}
    },
    {
      "comments": "[w7] visitsPoisonQueue — where a message the ledger rejects five times ends up, instead of blocking the queue.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 7)]",
      "type": "Microsoft.Storage/storageAccounts/queueServices/queues",
      "apiVersion": "2023-05-01",
      "name": "[format('{0}/default/{1}-poison', variables('funcStorageName'), variables('visitsQueueName'))]",
      "dependsOn": [
        "[resourceId('Microsoft.Storage/storageAccounts', variables('funcStorageName'))]"
      ],
      "properties": {}
    },
    {
      "comments": "[w7] lifecycle — ages the site account's blobs: Cool after 30 days, old versions deleted after 90.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 7)]",
      "type": "Microsoft.Storage/storageAccounts/managementPolicies",
      "apiVersion": "2023-05-01",
      "name": "[format('{0}/default', variables('webStorageName'))]",
      "dependsOn": [
        "[resourceId('Microsoft.Storage/storageAccounts', variables('webStorageName'))]"
      ],
      "properties": {
        "policy": {
          "rules": [
            {
              "enabled": true,
              "name": "age-out",
              "type": "Lifecycle",
              "definition": {
                "filters": { "blobTypes": [ "blockBlob" ] },
                "actions": {
                  "baseBlob": { "tierToCool": { "daysAfterModificationGreaterThan": 30 } },
                  "version": { "delete": { "daysAfterCreationGreaterThan": 90 } }
                }
              }
            }
          ]
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
      "comments": "[w6] bastion — Bastion Developer: a browser SSH session to the VM's private IP, no public port, no cost. The admin path once port 22 is closed.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 6)]",
      "type": "Microsoft.Network/bastionHosts",
      "apiVersion": "2023-11-01",
      "name": "[variables('bastionName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]",
      "sku": { "name": "Developer" },
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]"
      ],
      "properties": {
        "virtualNetwork": { "id": "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]" }
      }
    },
    {
      "comments": "[w10] deployIdentity — the identity GitHub Actions deploys as. A managed identity has no password to leak.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 10)]",
      "type": "Microsoft.ManagedIdentity/userAssignedIdentities",
      "apiVersion": "2023-01-31",
      "name": "[variables('deployIdentityName')]",
      "location": "[parameters('location')]",
      "tags": "[variables('tags')]"
    },
    {
      "comments": "[w10] githubFederation — trusts GitHub's OIDC tokens for one repository's main branch; the pipeline signs in with no stored secret.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 10)]",
      "type": "Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials",
      "apiVersion": "2023-01-31",
      "name": "[format('{0}/github-main', variables('deployIdentityName'))]",
      "dependsOn": [
        "[resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', variables('deployIdentityName'))]"
      ],
      "properties": {
        "issuer": "https://token.actions.githubusercontent.com",
        "subject": "[format('repo:{0}:ref:refs/heads/main', parameters('githubRepository'))]",
        "audiences": [ "api://AzureADTokenExchange" ]
      }
    },
    {
      "comments": "[w10] deployRole — Contributor on this resource group only, for the deploy identity. Never Owner, never the subscription.",
      "condition": "[greaterOrEquals(parameters('throughWeek'), 10)]",
      "type": "Microsoft.Authorization/roleAssignments",
      "apiVersion": "2022-04-01",
      "name": "[guid(resourceGroup().id, variables('deployIdentityName'), 'contributor')]",
      "dependsOn": [
        "[resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', variables('deployIdentityName'))]"
      ],
      "properties": {
        "roleDefinitionId": "[subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c')]",
        "principalId": "[reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', variables('deployIdentityName')), '2023-01-31').principalId]",
        "principalType": "ServicePrincipal"
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
    },
    "deployClientId": {
      "type": "string",
      "value": "[if(greaterOrEquals(parameters('throughWeek'), 10), reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', variables('deployIdentityName')), '2023-01-31').clientId, '')]"
    },
    "siteLbIp": {
      "type": "string",
      "value": "[if(greaterOrEquals(parameters('throughWeek'), 6), reference(resourceId('Microsoft.Network/publicIPAddresses', variables('lbPipName')), '2023-11-01').ipAddress, '')]"
    },
    "postgresHost": {
      "type": "string",
      "value": "[if(variables('withDatabase'), reference(resourceId('Microsoft.DBforPostgreSQL/flexibleServers', variables('pgName')), '2024-08-01').fullyQualifiedDomainName, '')]"
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
    "budgetAmount": { "value": 5 },
    "fleetSize": { "value": 0 },
    "createDatabase": { "value": false }
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
    "budgetAmount": { "value": 20 },
    "fleetSize": { "value": 2 },
    "createDatabase": { "value": false }
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
    { name: 'deployClientId', description: 'The deploy identity’s client id — the AZURE_CLIENT_ID the Week 10 workflow signs in with (empty before Week 10).' },
    { name: 'siteLbIp', description: 'The load balancer’s zone-redundant address — the fleet’s one front door (empty before Week 6).' },
    { name: 'postgresHost', description: 'The PostgreSQL server’s private host name (empty unless createDatabase is true).' },
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
    'Bastion is the Developer SKU: free, no AzureBastionSubnet, a browser session only. It is not offered in every region; where it is missing, Run Command remains the admin path.',
    'The fleet is parked: fleetSize defaults to 0, so the scale set and the balancer exist but no instance bills. Set fleetSize=2 (the prod file does) to serve; autoscale is enabled only then and holds the fleet between one and three.',
    'The fleet serves its page with what the Ubuntu image already has (python3), so an instance needs no outbound internet to come up — a Standard Load Balancer gives none unless you add an outbound rule or a NAT gateway.',
    'The database exists only with createDatabase=true and a dbAdminPassword passed on the command line. Zone-redundant HA is two D2ds_v4 nodes (about $0.30 an hour) and is not offered in every region; the course creates it by hand, stops it and deletes it in Week 8. A stopped server restarts by itself after seven days.',
    'Backups stay as disk snapshots (Week 8). Azure Backup and a Recovery Services vault cost about $5 a month per VM, so the course records the trade-off instead of deploying the vault.',
  ],
};
