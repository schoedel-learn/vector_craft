Hey Barry,

I see you want to give users a way to get back to the API entry screen after they've been routed to Google AI Studio. 

Since Google AI Studio is an external website, we can't actually put a "Back" button on their page. Currently, the link is set to open in a new tab (`target="_blank"`), which means the Vector Craft tab should still be open in the background for them to switch back to.

Could you clarify the exact experience you're seeing or want to change?
1. Are you testing on a mobile device where opening the link forces them out of the Vector Craft app entirely (like in a standalone PWA)?
2. Do you want to change the link to open a smaller pop-up window so Vector Craft stays visible behind it?
3. Or did you want me to update the instructions to explicitly tell the user "Copy the key, close this tab, and return to Vector Craft"? 
