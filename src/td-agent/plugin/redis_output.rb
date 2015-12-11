# -*- encoding: utf-8 -*- 

#= Redis出力プラグイン
#
#@author NICT
#
class RedisOutput < Fluent::Output
    Fluent::Plugin.register_output('redis_output', self)

    config_param :host, :string,  :default => '127.0.0.1'
    config_param :port, :integer, :default => 6379
    config_param :db,   :integer, :default => 0

    attr_reader :redis

    def initialize()
        super
        require 'redis'
        require 'json'
    end

    # 開始時処理
    #
    #@return [void]
    #
    def start()
        super

        @redis = Redis.new(:host => @host, :port => @port, :db => @db);
    end

    # 終了時処理
    #
    #@return [void]
    #
    def shutdown()
        super
    end

    # データ受信時処理
    # ・Redisにレコードを送信する
    #
    #@param [String]      tag   受信タグ
    #@param [EventStream] es    受信データ
    #@param [OutputChain] chain 受信時処理のチェーン
    #@return [void]
    #
    def emit(tag, es, chain)
        @redis.pipelined do
            es.each do |time,record|
                type = record["type"]
                key  = record["key"]
                data = record["data"]
                if data.is_a?(Hash) || data.is_a?(Array)
                    data = data.to_json
                end

                if type == "publish"
                    @redis.publish(key, data)

                elsif type == "push"
                    @redis.rpush(key, data)
                end
            end
        end
        chain.next
    end
end
