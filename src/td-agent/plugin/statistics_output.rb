# -*- encoding: utf-8 -*- 

#= 統計情報出力プラグイン
#
#@author NICT
#
class StatisticsOutput < Fluent::Output
    Fluent::Plugin.register_output("statistics_output", self)

    config_param :host, :string,  :default => '127.0.0.1'
    config_param :port, :integer, :default => 5125

    config_param :tag,      :string,  :default => 'statistics_output'
    config_param :service,  :string,  :default => 'statistics'
    config_param :interval, :integer, :default => 60
    config_param :output,   :string,  :default => '/var/local/visualizer/graph.html'

    config_param :color_send,     :string, :default => '#0000ff'
    config_param :color_filtered, :string, :default => '#00ff00'
    config_param :color_received, :string, :default => '#ff0000'
    
    config_param :graph_style, :string, :default => '?t=sh&gmode=gauge&border=0&width=320&background_color=666666&canvas_color=666666&font_color=CCCCCC&axis_color=AAAAAA'

    def initialize
        super
        require 'date'
        require 'growthforecast'
        require 'rubygems'
        require 'erb'

        @html = <<TABLE
<div id="container">
    <table bordar="0">
        <caption class="title">リソース使用状況一覧　%{date}</caption>
        <tr>
            <td class="title">ネットワーク（スループット）<br>
%{throughput}
            </td>
            <td class="title">CPU使用率<br>
%{cpu}
            </td>
            <td class="title">メモリ使用率<br>
%{memory}
            </td>
        </tr>
    </table>
    <table bordar="0">
        <caption class="title">オーバーレイ一覧</caption>
        <tr>
%{overlays}
        </tr>
    </table>
</div>
TABLE
    end

    # データ受信時処理
    # ・オーバーレイ情報受信時、グラフを作成
    # ・ノード情報受信時、データを蓄積
    # ・スループット情報受信時、データを蓄積
    #
    #@param [String]      tag   受信タグ
    #@param [EventStream] es    受信データ
    #@param [OutputChain] chain 受信時処理のチェーン
    #@return [void]
    #
    def emit(tag, es, chain)
        es.each do |time, record|
            record.each do |type, statistics|
                if type == "overlay"
                    statistics.each do |overlay_id, overlay_info|
                        # オーバーレイのスループットグラフを作成
                        overlay_info["throughput_graph"] =
                                "LINE2:#{(get_graph(@service, "throughput", overlay_id, 0, 'gauge') { get_color() }).id}:gauge:0"

                        # オーバーレイ内のサービスリンクのグラフを作成
                        r = overlay_info["service_links"].map { |link_id|
                            "LINE3:#{get_graph(@service, overlay_id, "#{link_id}_received", 0, 'gauge', @color_received).id}:gauge:0"
                        }.join(":")
                        f = overlay_info["service_links"].map { |link_id|
                            "LINE2:#{get_graph(@service, overlay_id, "#{link_id}_filtered", 0, 'gauge', @color_filtered).id}:gauge:0"
                        }.join(":")
                        s = overlay_info["service_links"].map { |link_id|
                            "LINE1:#{get_graph(@service, overlay_id, "#{link_id}_send        ", 0, 'gauge', @color_send        ).id}:gauge:0"
                        }.join(":")
                        overlay_info["overlay_graph"] = [r, f, s].join(":")

                        @mutex.synchronize {
                            @overlays[overlay_id] = overlay_info
                        }
                    end

                elsif type == "node"
                    @mutex.synchronize {
                        statistics.each do |node_id, node_info| 
                            @nodes[node_id] = node_info
                        end
                    }

                else
                    @mutex.synchronize {
                        statistics.each do |service_link_id, throughput|
                            @service_links[service_link_id][type] += throughput
                        end
                    }
                end
            end
        end
        chain.next
    end
    
    # 開始時処理
    #
    #@return [void]
    #
    def start()
        super

        @mutex         = Mutex.new
        @overlays      = Hash.new
        @nodes         = Hash.new {|h, k| h[k] = Hash.new(0)}
        @service_links = Hash.new {|h, k| h[k] = Hash.new(0)}
        @latest        = Fluent::Engine.now
        @watcher       = Thread.new(&method(:watch))

        @gf          = GrowthForecast.new(@host, @port)
        @url_base    = "http://#{@host}:#{@port}"
        @color_index = 0
        @colors      = ["#FF0000", "#FFD800", "#4CFF00", "#00FF8C", "#0099FF", "#4300FF"]

        init_usage()
    end

    # 終了時処理
    #
    #@return [void]
    #
    def shutdown()
        super
        @watcher.terminate
        @watcher.join
    end

    private

    def init_usage()
        @usage_types   = ["mem_usage", "cpu_usage"]
        @usage_colmuns = [
                {"label" => " 0- 19%", "value" => 0, "color" => "#0000FF"},
                {"label" => "20- 39%", "value" => 0, "color" => "#00FFFF"},
                {"label" => "40- 59%", "value" => 0, "color" => "#00FF00"},
                {"label" => "60- 79%", "value" => 0, "color" => "#FFFF00"},
                {"label" => "80-100%", "value" => 0, "color" => "#FF0000"}
        ]
        usage_graphs = {}
        @usage_types.each do |type|
            usage_graphs[type] = @usage_colmuns.map { |data|
                "AREA:#{get_graph(@service, type, data["label"], data["value"], 'gauge', data["color"]).id}:gauge:0"
            }.join(":")
        end

        @memory_graph = usage_graphs["mem_usage"]
        @cpu_graph    = usage_graphs["cpu_usage"]
    end

    def get_color()
        color = @colors[@color_index % @colors.length]
        @color_index += 1
        return color
    end

    # Growthforecastへのメッセージ送信
    #
    def post(service, section, name, value, mode=nil, color=nil)
        # 名前の記号をURLエンコード
        @gf.post(service, section, ERB::Util.url_encode(name), value, mode, color)
    end

    # 名前からグラフを取得、なければ新規作成する
    #
    def get_graph(service, section, name, value, mode=nil, color=nil)
        graph = @gf.by_name(service, section, name)
        if graph.nil?
            if color.nil? && block_given?
                color = yield
            end
            post(service, section, name, value, mode, color)
            graph = @gf.by_name(service, section, name)
        end
        return graph
    end

    # グラフの更新タイマー
    #
    def watch
        while true
            sleep 0.5
            now = Fluent::Engine.now
            if now - @latest >= @interval
                flush_emit()
                @latest = now
            end
        end
    end

    # グラフの更新処理
    #
    def flush_emit()
    begin
        tmp_links    = nil
        tmp_nodes    = nil
        tmp_overlays = nil
        @mutex.synchronize {
            tmp_links = @service_links
            tmp_nodes = @nodes
            tmp_overlays = Marshal.load(Marshal.dump(@overlays))

            @service_links = Hash.new {|h, k| h[k] = Hash.new(0)}
            @nodes = Hash.new {|h, k| h[k] = Hash.new(0)}
        }
        $log.debug("nodes: #{tmp_nodes}")
        $log.debug("overlays: #{@overlays}")
        $log.debug("links: #{tmp_links}")

        # グラフ出力
        # オーバーレイ＆スループット
        tmp_overlays.each do |overlay_id, overlay|
            throughput = 0
            overlay["service_links"].each do |link_id|
                throughput += tmp_links[link_id]["received"]
                post(@service, overlay_id, "#{link_id}_received", tmp_links[link_id]["received"], 'gauge')
                post(@service, overlay_id, "#{link_id}_filtered", tmp_links[link_id]["filtered"], 'gauge')
                post(@service, overlay_id, "#{link_id}_send        ", tmp_links[link_id]["send"],         'gauge')
            end
            post(@service, "throughput", overlay_id, throughput, 'gauge')
        end
        post(@service, "throughput", "0_0", 0, 'gauge')

        # ノードリソース
        @usage_types.each do |type|
            output = Marshal.load(Marshal.dump(@usage_colmuns))

            div = 100.0 / output.length
            tmp_nodes.each_value do |node|
                index = (node[type] / div).truncate
                index = index < output.length ? index : output.length - 1
                output[index]["value"] += 1
            end
            $log.debug(output)
            output.each do |data|
                post(@service, type, data["label"], data["value"], 'gauge')
            end
        end

        # HTML出力
        now  = Time.now
        now -= now.to_i % 60
        to   = now.strftime("%Y/%m/%d%%20%H:%M:%S")
        now -= 60 * 15
        from = now.strftime("%Y/%m/%d%%20%H:%M:%S")
        timestamp = "t=sc&from=#{from}&to=#{to}&#{Time.now.to_i}"
        #timestamp = Time.now.to_i

        overlay_graphs = ""
        throughput_graphs = []
        index = 0
        tmp_overlays.each_value do |overlay|
            overlay_graphs << "<td class=\"title\">#{overlay["name"]}<br>"
            overlay_graphs << "<img border=\"0\" src=\"#{@url_base}/graph/#{overlay["overlay_graph"]}#{graph_style}&#{timestamp}\">"
            overlay_graphs << "</td>\n"
            index += 1
            if (index % 3) == 0
                overlay_graphs << "</tr><tr>"
            end
            throughput_graphs << overlay["throughput_graph"]
        end
        throughput_graph = "<img border=\"0\" src=\"#{@url_base}/graph/#{throughput_graphs.join(":")}#{graph_style}&#{timestamp}\">"
        memory_graph     = "<img border=\"0\" src=\"#{@url_base}/graph/#{@memory_graph}#{graph_style}&#{timestamp}\">"
        cpu_graph        = "<img border=\"0\" src=\"#{@url_base}/graph/#{@cpu_graph}#{graph_style}&#{timestamp}\">"

        File.write(@output, sprintf(@html,
                date: DateTime.now.strftime("%Y年%m月%d日 %H時%M分%S秒 更新"),
                style: @graph_style,
                cpu: cpu_graph,
                memory: memory_graph,
                overlays: overlay_graphs,
                throughput: throughput_graph
        ))
    rescue => e
        $log.error(e)
    end
    end

end
