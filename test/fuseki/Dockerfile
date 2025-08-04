# Use a Java base image
FROM eclipse-temurin:17-jdk

# Define Fuseki version
ENV FUSEKI_VERSION=5.5.0

# Install wget and unzip
RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*

# Create Fuseki home directory
RUN mkdir -p /opt/fuseki

# Download and extract Fuseki
WORKDIR /tmp
RUN wget -q --show-progress https://archive.apache.org/dist/jena/binaries/apache-jena-fuseki-$FUSEKI_VERSION.tar.gz && \
    tar -xzf apache-jena-fuseki-$FUSEKI_VERSION.tar.gz && \
    cp -r apache-jena-fuseki-$FUSEKI_VERSION/* /opt/fuseki/ && \
    rm -rf apache-jena-fuseki-$FUSEKI_VERSION* && \
    chmod +x /opt/fuseki/fuseki-server

# Create a non-root user with a specific UID
RUN useradd -u 1001 -m -s /bin/bash fuseki

# Create required directories and set permissions
RUN mkdir -p /opt/fuseki/databases && \
    mkdir -p /opt/fuseki/configuration && \
    chown -R fuseki:fuseki /opt/fuseki && \
    chmod -R 777 /opt/fuseki/configuration && \
    chmod -R 777 /opt/fuseki/databases

# Copy config files
COPY shiro.ini /opt/fuseki/shiro.ini
COPY config.ttl /opt/fuseki/config.ttl
RUN chmod 644 /opt/fuseki/shiro.ini && \
    chown fuseki:fuseki /opt/fuseki/shiro.ini

# Expose HTTP port
EXPOSE 3030

# Switch to non-root user
USER fuseki

# Set default command
CMD ["/opt/fuseki/fuseki-server", "--config=/opt/fuseki/config.ttl"]