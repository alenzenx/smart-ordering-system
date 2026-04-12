FROM node:20-bookworm-slim AS node

FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=node /usr/local/ /usr/local/

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
RUN npm install -g @google/gemini-cli@latest

COPY . /app
