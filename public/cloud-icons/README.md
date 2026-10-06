# Cloud architecture icons

The files here are copied **unchanged** from the platforms' official icon
packs and are used only in the two cloud capstones' architecture diagrams
(`src/lib/cloud/officialIcons.ts` lists which key renders which file).

| Folder | Source | Terms |
|---|---|---|
| `aws/` | AWS Architecture Icons, package `Icon-package_07312026` (also browsable at awsicons.dev) | AWS permits the icons in architecture diagrams, training material and documentation about AWS. Do not alter the icons. |
| `azure/` | Microsoft Azure Public Service Icons, V24 (also browsable at az-icons.com) | Microsoft permits the icons in architecture diagrams, training material and documentation about Azure. Do not recolour or reshape them; the pack's `Microsoft_Terms_of_Use.pdf` and `Azure_Icons_FAQ.pdf` state the terms. |

Keys with no file here are drawn in `src/components/diagrams/cloud/CloudIcon.tsx`
(R103: `bastion`, `backup`, `identity`, `audit`, plus Azure's `github` and
`notify`); add the pack's file and list the key in `officialIcons.ts` to
replace a drawing.

Naming: `<key>.svg` is the icon for `CloudIconKey` `<key>`; `<key>.dark.svg`
is the pack's dark-background version, used when the site is in dark mode;
`group-<kind>.svg` is the group icon drawn in a container's corner.

## AWS — which file each key is

| key | pack file |
|---|---|
| user (+dark) | Resource-Icons/Res_General-Icons/Res_48_{Light,Dark}/Res_User_48 |
| github (+dark) | Resource-Icons/Res_General-Icons/…/Res_Git-Repository_48 |
| firewall (+dark) | Resource-Icons/Res_General-Icons/…/Res_Firewall_48 |
| vm | Res_Compute/Res_Amazon-EC2_Instance_48 |
| disk | Res_Storage/Res_Amazon-Elastic-Block-Store_Volume_48 |
| function | Res_Compute/Res_AWS-Lambda_Lambda-Function_48 |
| nosql | Res_Databases/Res_Amazon-DynamoDB_Table_48 |
| storage | Res_Storage/Res_Amazon-Simple-Storage-Service_Bucket_48 |
| cdn | Architecture-Service-Icons/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48 |
| api | Architecture-Service-Icons/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48 |
| logs | Res_Management-Governance/Res_Amazon-CloudWatch_Logs_48 |
| alert | Res_Management-Governance/Res_Amazon-CloudWatch_Alarm_48 |
| notify | Res_Application-Integration/Res_Amazon-Simple-Notification-Service_Topic_48 |
| budget | Architecture-Service-Icons/Arch_Cloud-Financial-Management/48/Arch_AWS-Budgets_48 |
| role | Res_Security-Identity/Res_AWS-Identity-Access-Management_Role_48 |
| group | Architecture-Service-Icons/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48 |
| param | Res_Management-Governance/Res_AWS-Systems-Manager_Parameter-Store_48 |
| gateway | Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48 |
| route | Res_Networking-Content-Delivery/Res_Amazon-VPC_Router_48 |
| bucketpolicy, oac | Res_Security-Identity/Res_AWS-Identity-Access-Management_Permissions_48 (AWS has no Origin Access Control icon; it is a permission) |
| group-account (+dark) | Architecture-Group-Icons/AWS-Cloud_32 |
| group-region | Architecture-Group-Icons/Region_32 |
| group-network | Architecture-Group-Icons/Virtual-private-cloud-VPC_32 |
| group-subnet | Architecture-Group-Icons/Public-subnet_32 |
| group-subnet-private | Architecture-Group-Icons/Private-subnet_32 |

## Azure — which file each key is

| key | pack file (`Azure_Public_Service_Icons/Icons/…`) |
|---|---|
| user | identity/10230-icon-service-Users |
| vm | compute/10021-icon-service-Virtual-Machine |
| disk | compute/10032-icon-service-Disks |
| storage | storage/10086-icon-service-Storage-Accounts |
| blobservice | general/10839-icon-service-Storage-Container |
| function | compute/10029-icon-service-Function-Apps |
| plan | web/00046-icon-service-App-Service-Plans |
| nosql, container | databases/10121-icon-service-Azure-Cosmos-DB (the ARM visualizer uses the one icon for account, database and container) |
| secret | security/10245-icon-service-Key-Vaults |
| role | identity/10340-icon-service-Entra-Identity-Roles-and-Administrators |
| firewall | networking/10067-icon-service-Network-Security-Groups |
| publicip | networking/10069-icon-service-Public-IP-Addresses |
| nic | networking/10080-icon-service-Network-Interfaces |
| logs | monitor/00009-icon-service-Log-Analytics-Workspaces |
| apm | monitor/00012-icon-service-Application-Insights |
| diag | monitor/00008-icon-service-Diagnostics-Settings |
| alert | management + governance/00002-icon-service-Alerts |
| budget | general/10793-icon-service-Cost-Budgets |
| policy | management + governance/10316-icon-service-Policy |
| group-account | general/10002-icon-service-Subscriptions |
| group-group | general/10007-icon-service-Resource-Groups |
| group-network | networking/10061-icon-service-Virtual-Networks |
| group-subnet, group-subnet-private | networking/02742-icon-service-Subnet |

Not in the Azure pack, so drawn in `CloudIcon.tsx`: GitHub, an action group.
