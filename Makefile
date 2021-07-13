api:
	docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
		-i https://api.twitter.com/2/openapi.json \
		-g typescript-axios \
		-o /local/lib/client
