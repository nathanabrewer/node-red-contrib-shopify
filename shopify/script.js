
module.exports = function(RED) {
    "use strict";

    function shopifyScript(n) {
      console.log()
        
        RED.nodes.createNode(this,n);  

        var auth = RED.nodes.getNode(n.authorization);

        var baseURL = 'https://'+auth.shop+'.alky.lol';
        var node = this;
        
        node.shopifyClient = auth.getShopifyClient();
        
        var urlSuffix = "/shopify-script/"+this.id;
        var url = baseURL+urlSuffix;
        var scriptContent = n.customscript;

        var createScriptTag = true;

        node.getScript = function(){
          return scriptContent;
        };

        node.shopifyClient.get('/admin/script_tags.json', function(err, data){
          if(err) console.log(err);
            console.log('['+node.id+'] Looking for script_tags');
            
            if(typeof data.script_tags !== 'undefined'){

            data.script_tags.forEach(function(script_tag){
              if(script_tag.src == url){
                createScriptTag = false;
                if(!n.enabled){
                  //we need to remove this...
                  console.log('['+node.id+'] Script Tag Exists, but is disabled. Removing Tag.');
                  node.shopifyClient.delete('/admin/script_tags/'+script_tag.id+'.json', function(err, data, headers){    
                    if(err){
                      console.log('['+node.id+'] ERROR disabling script_tag '+script_tag.id);
                      node.status({fill:"red",shape:"ring",text:"ERROR DISABLING "+script_tag.id});
                    }else{
                      console.log('['+node.id+'] Successfully Disabled script_tag '+script_tag.id);
                      node.status({fill:"yellow",shape:"ring",text:"disabled"});
                    }
                  });
                }
              } 
            });

            if(createScriptTag && n.enabled){
              console.log('['+node.id+'] Create Script Tag '+url);
              node.shopifyClient.post('/admin/script_tags.json', {"script_tag":{ "src": url, "event": "onload"}}, function(err, data, headers){
                  if(err) return node.status({fill:"red",shape:"ring",text:"error creating"});
                  
                  node.status({fill:"green",shape:"ring",text:"Creation Successful "});
              });
            }

            if(! n.enabled){
              node.status({fill:"yellow",shape:"ring",text:"This Script has been Disabled."});
            }

          }
        });


        var counter = 0;
        this.callback = function(req,res) {
            counter++
            node.status({fill:"green",shape:"ring",text:"Script Fetch Counter "+counter});
            res.send(node.getScript());
        };

        var httpMiddleware = function(req,res,next) { next(); }
        console.log('['+node.id+'] INITIALIZING SCRIPT GET URL: ', url);
        RED.httpNode.get(urlSuffix,httpMiddleware,this.callback);

        this.on("close",function() {
            //var node = this;
            console.log('['+node.id+'] attempting to cleanup...');
            RED.httpNode._router.stack.forEach(function(route,i,routes) {
                if (route.route && route.route.path === urlSuffix ) {
                    routes.splice(i,1);
                    console.log('['+node.id+'] removed route from stack (( '+i+' )). it is done.');
                }

            });
        });


     
    }
    RED.nodes.registerType("shopify-script",shopifyScript);    
}
