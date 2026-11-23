# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Assumption from the repository: individuals using Finora to manage personal budgets.
- Confirmed admin audience: an authorized operator managing accounts, roles, and account availability.

## Product Purpose

Repository evidence describes Finora as a personal budgeting application for tracking income and expenses, managing monthly category budgets, and viewing financial summaries. This purpose is inferred from the project documentation and should be confirmed by the product owner.

## Capabilities and Constraints

- The existing application uses a React/Vite web client and a NestJS API backed by MySQL.
- Confirmed admin tasks: find accounts, change roles, disable or re-enable accounts, view aggregate sign-up and traffic statistics, and check API/database status.
- Admin tools must not expose individual users' transactions or budgets.
- Admin privileges must be enforced by the API, not only by frontend navigation.
- Account removal is not part of the confirmed admin scope.

## Evidence on Hand

- `README.md` documents the current product functionality and local setup.
- `web/` and `api/` contain the existing client and service implementation.
