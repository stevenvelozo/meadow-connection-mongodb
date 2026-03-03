#!/bin/bash
# MongoDB Test Database Management Script for meadow-connection-mongodb
#
# Usage:
#   ./scripts/mongodb-test-db.sh start   - Start MongoDB container and wait for readiness
#   ./scripts/mongodb-test-db.sh stop    - Stop and remove the container
#   ./scripts/mongodb-test-db.sh status  - Check if the container is running
#
# The container settings match the test configuration in
# test/MongoDB_tests.js:
#   Host: 127.0.0.1, Port: 27117, Database: meadow_conn_test

CONTAINER_NAME="meadow-conn-mongodb-test"
MONGODB_PORT="27117"
MONGODB_IMAGE="mongo:7"

start_mongodb() {
	# Check if container already exists
	if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
		if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
			echo "MongoDB test container is already running."
			return 0
		else
			echo "Removing stopped container..."
			docker rm "${CONTAINER_NAME}" > /dev/null 2>&1
		fi
	fi

	echo "Starting MongoDB test container..."
	docker run -d \
		--name "${CONTAINER_NAME}" \
		-p "${MONGODB_PORT}:27017" \
		"${MONGODB_IMAGE}"

	if [ $? -ne 0 ]; then
		echo "ERROR: Failed to start MongoDB container."
		exit 1
	fi

	echo "Waiting for MongoDB to be ready..."
	RETRIES=30
	until docker exec "${CONTAINER_NAME}" mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
		RETRIES=$((RETRIES - 1))
		if [ $RETRIES -le 0 ]; then
			echo "ERROR: MongoDB failed to become ready in time."
			docker logs "${CONTAINER_NAME}" 2>&1 | tail -20
			exit 1
		fi
		echo "  ...waiting (${RETRIES} retries left)"
		sleep 2
	done

	echo ""
	echo "MongoDB test database is ready!"
	echo "  Container: ${CONTAINER_NAME}"
	echo "  Host:      127.0.0.1:${MONGODB_PORT}"
	echo "  Database:  meadow_conn_test"
	echo ""
	echo "Run tests with: npm test"
}

stop_mongodb() {
	if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
		echo "Stopping and removing MongoDB test container..."
		docker stop "${CONTAINER_NAME}" > /dev/null 2>&1
		docker rm "${CONTAINER_NAME}" > /dev/null 2>&1
		echo "MongoDB test container removed."
	else
		echo "No MongoDB test container found."
	fi
}

status_mongodb() {
	if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
		echo "MongoDB test container is running."
		docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	elif docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
		echo "MongoDB test container exists but is stopped."
	else
		echo "MongoDB test container is not running."
	fi
}

case "${1}" in
	start)
		start_mongodb
		;;
	stop)
		stop_mongodb
		;;
	status)
		status_mongodb
		;;
	*)
		echo "Usage: $0 {start|stop|status}"
		exit 1
		;;
esac
