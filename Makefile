exec:
	$(eval TASK := $(shell aws ecs list-tasks --cluster oniku-bot --query 'taskArns[0]'))
	aws ecs execute-command --cluster oniku-bot \
		--task ${TASK} \
		--container twitter-stream \
		--interactive \
		--command "/bin/sh"
