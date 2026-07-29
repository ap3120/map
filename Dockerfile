FROM ubuntu:20.04

USER root

RUN apt-get update && apt-get install -y git curl npm nodejs composer
