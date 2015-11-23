
module.exports = function(RED) {
    "use strict";

    function shopifyCustomer(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var authorization = RED.nodes.getNode(config.authorization);

        console.log('shopifyCustomer', authorization);
        console.log('shopifyCustomer', config);


        var ShopifyClient = authorization.getShopifyClient();

        this.on('input', function (msg) {
           if(!authorization){ return console.log('no authorization, i do nothing'); }
             

           switch(msg.topic){

            case 'create':
              this.create(msg.payload);
            break;
            
            case 'update':
              if(typeof msg.payload.customer_id === undefined){
                node.send([{error:1, msg:'refusing, no topic set. Expecting customer id.'}, null]);
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


        this.create = function(payload){
            ShopifyClient.post('/admin/customers.json', { "customer": payload }, function(err, data, headers){
              if(err){
                node.send([err, null]);
              }else{
                node.send([null,{payload: data, headers:headers}]);
              }

            });
        };

        this.update = function(payload){
            ShopifyClient.put('/admin/customers/'+payload.customer_id+'.json', { "customer": payload }, function(err, data, headers){
              if(err){
                node.send([err, null]);
              }else{
                node.send([null,{payload: data, headers:headers}]);
              }
            });
        };

        this.getAll = function(){
          console.log(this.shopify);
            ShopifyClient.get('/admin/customers.json', function(err, data, headers){
              if(err){
                node.send([err, null]);
              }else{
                node.send([null,{payload: data, headers:headers}]);
              }
            });
        };

    }

    RED.nodes.registerType("shopify-customer",shopifyCustomer);
}
