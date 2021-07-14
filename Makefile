api:
	docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
		-i https://api.twitter.com/2/openapi.json \
		-g typescript-axios \
		-o /local/lib/client

run:
	docker build . -t twitter-stream
	docker run --rm -it --env-file .env twitter-stream
