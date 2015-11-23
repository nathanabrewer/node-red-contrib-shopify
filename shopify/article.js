
module.exports = function(RED) {
    "use strict";

    function shopifyArticle(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var authorization = RED.nodes.getNode(config.authorization);

        var ShopifyClient = authorization.getShopifyClient();

        this.on('input', function (msg) {
          if(!authorization){ 
            return console.log('no authorization, i do nothing'); 
          }
             
          switch(msg.topic){
            case 'create':
            if(msg.blog_id === undefined) return console.log('require blogid for now');
              this.create(msg.blog_id, msg.payload);
            break;
            
            case 'update':
            if(typeof msg.payload.article_id === undefined){
              node.send([{error:1, msg:'refusing, Expecting article_id.'}, null]);
            }else{
              this.create(msg.payload);
            }
            break;
            
            case 'lookup':
              node.send([{error:1, msg:'program has not been programmed yet. programmer error.'}, null])
            break;
            
            case 'all':
              this.getAll();
            break;            
          };

        });

        this.on("close", function() {

        });


        this.create = function(blog_id, payload){
          
            var url = '/admin/blogs/'+blog_id+'/articles.json';
            var data = { article: payload };
            console.log('dump', url, data);

            ShopifyClient.post(url, data, function(err, data, headers){
              if(err){
                node.send([err, null]);
              }else{
                node.send([null,{payload: data, headers:headers}]);
              }

            });
        };

        this.update = function(payload){
            ShopifyClient.put('/admin/articles/'+payload.article_id+'.json', { "article": payload }, function(err, data, headers){
              if(err){
                node.send([err, null]);
              }else{
                node.send([null,{payload: data, headers:headers}]);
              }
            });
        };

        this.getAll = function(){
          console.log(this.shopify);
            ShopifyClient.get('/admin/articles.json', function(err, data, headers){
              if(err){
                node.send([err, null]);
              }else{
                node.send([null,{payload: data, headers:headers}]);
              }
            });
        };

    }

    RED.nodes.registerType("shopify-article",shopifyArticle);
}
