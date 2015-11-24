
module.exports = function(RED) {
    "use strict";

    function shopifyWebhook(n) {

        RED.nodes.createNode(this,n);  

        var auth = RED.nodes.getNode(n.authorization);

        var baseURL = 'https://'+auth.shop+'.alky.lol';

        var node = this;
        
        node.shopifyClient = auth.getShopifyClient();
        node.webhook_id = null;

        var urlSuffix = "/shopify-webhook/"+this.id;
        var url = baseURL+urlSuffix;
        var topic = n.webhook_event;
        var createWebhook = true;
        var remove_webhook_ids = [];
        //do we have this webhook?
        node.shopifyClient.get('/admin/webhooks.json', function(err, data){
            if(err) console.log(err);
            console.log('['+node.id+'] Looking for existing hooks');
            
            if(typeof data.webhooks !== 'undefined'){

            data.webhooks.forEach(function(webhook){
              if(webhook.address == url){
                if(webhook.topic == topic){
                  createWebhook = false;
                  node.status({fill:"green",shape:"ring",text:"Active Since "+webhook.created_at});
                }else{
                  remove_webhook_ids.push(webhook.id);
                }
              } 
            });

            if(createWebhook){
              console.log('['+node.id+'] Create Webhook '+topic);
              node.shopifyClient.post('/admin/webhooks.json', { "webhook": { "topic": topic, "address": url, "format": "json" }}, function(err, data, headers){
                  console.log(data);
                  if(err){
                    return node.status({fill:"red",shape:"ring",text:"error"});
                  }
                  node.status({fill:"red",shape:"ring",text:"Creation Successful "+data.webhook.id});
              });

            }else{
              console.log('['+node.id+'] Webhooks already exist for '+topic);
            }

            remove_webhook_ids.forEach(function(webhook_id){
              node.shopifyClient.delete('/admin/webhooks/'+webhook_id+'.json', function(err, data, headers){
                if(err){
                  console.log("error removing webhook ", err);
                }
                console.log('['+node.id+'] REMOVING UNWANTED WEBHOOKS '+webhook_id);
                
              });              
            });

          }
        });

        this.errorHandler = function(err,req,res,next) {
            node.warn(err);
            res.sendStatus(500);
        };

      var counter = 0;
        this.callback = function(req,res) {
            counter++
            node.status({fill:"green",shape:"ring",text:"counter "+counter});
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            node.send({ 
              _msgid:msgid, 
              shopify: node.shopifyClient,
              req:req, 
              payload:req.body 
            });
            res.json({success:1});

        };

        var httpMiddleware = function(req,res,next) { next(); }
        console.log('INITIALIZING WEBHOOK POST URL: ', url);
        RED.httpNode.post(urlSuffix,httpMiddleware,this.callback,this.errorHandler );

        this.on("close",function() {
            RED.httpNode._router.stack.forEach(function(route,i,routes) {
                if (route.route && route.route.path === urlSuffix) {
                    routes.splice(i,1);
                }
            });
        });


     
    }
    RED.nodes.registerType("shopify-webhook",shopifyWebhook);    
}
