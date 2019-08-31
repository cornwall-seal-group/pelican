# Pelican

Provides an API to submit images to an Azure Custom Vision Object Detection model.

## Available Tags

We will want the Azure model to have images for the following tags:

```
# WET
b221998c-0d8b-46de-b6f9-8561b13690c5 wet-head-left
36ad0cbd-0030-4cf8-8805-4f35be44f435 wet-head-right
9ed9eaad-43c8-4ac2-aa59-6c3f53b32f9f wet-head-straight

7b62b8e3-21e2-42c6-8c2c-b1d88b4c4a07 bottling-right
93c56914-198b-49cc-ac76-3ff183c69740 bottling-left
9f8e9065-7eff-4df0-93f6-ad3e98fbccc6 bottling-straight

92bbe322-bb7e-465f-b120-2da93350eed2 wet-body-right
2dc4a497-e5d7-46c8-843c-6ff4387978e0 wet-body-left

# DRY

826a4746-1595-4829-9d2c-8524b5b2e623 dry-head-left
55799bda-27d8-4c58-9f2c-811528845c58 dry-head-right
75dae3af-1c41-4952-a612-43dc4f7a42b0 dry-head-straight

99d2e491-aa7b-4f40-a398-b40186e53636 dry-body-right
77a3c4f5-5ae6-494f-97ba-5ef38622c3a2 dry-body-left
```

## Running with forever

To run the app using forever run:

```
export NODE_ENV=prod && nohup forever start -c "node src/index.js" ./
