.PHONY: install
install:
	cd backend && npm i

.PHONY: test
test:
	cd backend && npm test

.PHONY: dev
dev:
	cd backend && npm run dev
