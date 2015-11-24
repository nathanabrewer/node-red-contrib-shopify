
module.exports = function(RED) {

    "use strict";

    var shopifyAPI = require('shopify-node-api');

    function shopifyAuthorization(config) {
        // Create a RED node
        RED.nodes.createNode(this,config);
        var node = this;

        node.shop = config.shop.split(".")[0];
        
        var ShopifyClient = new shopifyAPI({
                shop: config.shop, 
                shopify_api_key: config.apikey,           //TODO: REMOVE
                shopify_shared_secret: config.apisecret,  //TODO: REMOVE
                shopify_scope: "write_content, write_themes, write_products, write_customers, write_orders, write_script_tags, write_fulfillments, write_shipping",
                verbose: false,
                access_token: config.token
            });

        this.getShopifyClient = function(){
            return ShopifyClient;
        }

        this.getBlogs = function(){
            
   
            
        };
        
      
      }

      //
      //front end requests for blogs, articles, products, etc....
      RED.httpAdmin.post("/shopify-authorization/:id", RED.auth.needsPermission("shop-authorization.unlock"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                var ShopifyClient = node.getShopifyClient();
                switch(req.body.list_request){
                    case 'blogs':
                        ShopifyClient.get('/admin/blogs.json', function(err, data){
                            res.send( data.blogs );
                        });
                    break;
                    case 'articles':
                        var blog_id = req.body.blog_id;
                        ShopifyClient.get('/admin/blogs/'+blog_id+'/articles.json?fields=id,title', function(err, data){
                            res.send( data.articles );
                        });
                    break;                    
                    default:
                        res.send('not sure?');
                    break;
                }



            } catch(err) {
                res.send(500);
                node.error(RED._("inject.failed",{error:err.toString()}));
            }
        } else {
            res.send(404);
        }
    });

    RED.nodes.registerType("shopify-authorization",shopifyAuthorization);

}
