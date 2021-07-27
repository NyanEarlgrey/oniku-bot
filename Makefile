exec:
	$(eval TASK := $(shell aws ecs list-tasks --cluster oniku-bot --query 'taskArns[0]'))
	aws ecs execute-command \
		--cluster oniku-bot \
		--task ${TASK} \
		--container twitter-stream \
		--interactive \
		--command "/bin/sh"

tail:
	aws logs tail \
		--follow \
		--filter '{ $$.level = "info" || $$.level = "error" }' \
		--since 24h \
		--format short \
		oniku-bot
