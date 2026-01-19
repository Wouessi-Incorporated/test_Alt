.PHONY: help start setup dev server generate clean

help:
@echo "ALTURA - Available commands:"
@echo ""
@echo "  make start      Start the server"
@echo "  make setup      Configure environment"
@echo "  make dev        Setup + start"
@echo "  make server     Start server directly"
@echo "  make generate   Generate static pages"
@echo "  make clean      Remove .env and data"
@echo ""

start:
npm start

setup:
npm run setup

dev:
npm run dev

server:
npm run server

generate:
npm run generate

clean:
rm -f ALTURA_SERVER/server/.env
rm -rf ALTURA_SERVER/server/data/
@echo "Cleaned .env and data files"

install:
@echo "No dependencies to install - pure Node.js!"

.DEFAULT_GOAL := help
