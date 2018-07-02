module.exports = function(app, dir, RED, settings_nodered) {
    var exec_opt = {hydra_exec_host: "mosquitto"}
    var exec_bash_opt = Object.assign({type: "bash"}, exec_opt)
    var bodyParser = require('body-parser');
    var mustache = require('mustache');
    var exec = require('ttbd-exec');
    var iw = require('ttbd-iwlist')('wlan0', exec_opt);

    var fs = require("fs");
    var path = require("path");

    if(fs.existsSync(path.join(dir, 'views', 'portal.ejs')) === false){
        return false
    }

    function getScript(mode){
      var sc = {
        enable_ap: {
          file: 'set_access_point.sh',
          mustache: {
            ssid_id: (settings_nodered.functionGlobalContext.settings.id || "ap").slice(-4)
          }
        },
        disable_ap: {
          file: 'unset_access_point.sh',
          mustache: {}
        },
        set_wifi: {
          file: 'set_dhcp.sh',
          mustache: {
            net_env_interface: 'wlan0'
          }
        }
      }
      if(sc.hasOwnProperty(mode)){
        let script_path = path.join(__dirname, '..', 'node_modules', 'ttbd-node-interfaces', 'scripts', sc[mode].file)
        if(fs.existsSync(script_path) === false){
            return null
        }
        return mustache.render(fs.readFileSync(script_path, {encoding: 'utf8'}), sc[mode].mustache)
      }
    }

    function setAP(enable, callback){
        exec({file: getScript((enable===true?'enable_ap':'disable_ap'))}, exec_bash_opt, function(err, stdout, stderr){
            if(err){
                console.log(`set access point to ${enable}`);
                console.log(err);
                console.log(stdout);
                console.log(stderr);
            }
            if(typeof callback === "function"){
                callback(err);
            }
        });
    }

    function getPassphrase(params, callback){
        var script_get_passphrase = `#!/bin/bash

TMPFILE=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

wpa_passphrase ${params.ssid} <<EOF > /tmp/.$TMPFILE
${params.password}
EOF

sed -i '/#psk=/d' /tmp/.$TMPFILE
PASSPHRASE=\`cat  /tmp/.$TMPFILE | grep "psk=" | cut -d "=" -f 2\`
rm /tmp/.$TMPFILE

echo "$PASSPHRASE"

`
        if(params.secured === 'true' || params.secured === true){
            exec({file: script_get_passphrase}, exec_bash_opt, function(err, stdout, stderr){
                if(err){
                    console.log('script_get_passphrase');
                    console.log(err);
                    console.log(stdout);
                    console.log(stderr);
                }
                if(typeof callback === "function"){
                    var password = null
                    if(stdout){
                        password = stdout.replace(/[\r\n\t\f\v]/g, "").trim()
                    }
                    callback(err, password);
                }
            });
        } else if(typeof callback === "function"){
            callback(null, null)
        }
    }

    function setWiFi(params, callback){
        var script_set_wifi = getScript('set_wifi')
        getPassphrase(params, function(err, passphrase){
            var script_set_ssid = `#!/bin/bash

cat <<EOF > /etc/wpa_supplicant/wpa_supplicant.conf &
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="${params.ssid}"
    ${(passphrase !== null)?`psk=${passphrase}`:''}
    ${(passphrase !== null)?'key_mgmt=WPA-PSK':'key_mgmt=NONE'}
}

EOF

`
            exec({file: script_set_wifi}, exec_bash_opt, function(err2, stdout2, stderr2) {
                if(err2){
                    console.log('setWiFi');
                    console.log(err2);
                    console.log(stderr2);
                    console.log(stdout2);
                }
                exec({file: script_set_ssid}, exec_bash_opt, function(err3, stdout3, stderr3) {
                    if(err3){
                        console.log('setSSID');
                        console.log(err3);
                        console.log(stderr3);
                        console.log(stdout3);
                    }
                    if(typeof callback === "function"){
                        callback(err3);
                    }
                });
            });
        })

    }

    function reboot(){
        exec('reboot', exec_opt, function(err, stdout, stderr){
            if(err){
                console.log('reboot');
                console.log(err);
                console.log(stdout);
                console.log(stderr);
            }
        });
    }

    function getHostname(callback){
        exec('cat /etc/hostname', exec_opt, function(err, stdout, stderr){
            if(err){
                console.log('hostname');
                console.log(err);
                console.log(stdout);
                console.log(stderr);
            }
            if(typeof callback === "function"){
                callback(err, stdout.replace(/[\r\n\t\f\v]/g, "").trim().replace(/[ ]+/g,"_"));
            }
        });

    }

    function ipLinkShowParseParam(line, key){
        let paramIndex = line.indexOf(key)
        if(paramIndex !== -1 && paramIndex < line.length-1){
            return line[paramIndex+1]
        } else {
            return undefined
        }
    }

    function getInterfaces(callback){
      exec('ip link show', exec_opt, function(err, stdout, stderr){
          if(err){
            callback(null)
          }
          var interfaces = stdout.split('\n')
          interfaces = interfaces.filter(e => e && !e.startsWith(' '))
          var result = {}

          for(var i in interfaces){
              let netInterface = interfaces[i].replace(/\s\s+/g, ' ').split(' ')
              let interfaceName = netInterface[1].slice(0, -1)
              result[interfaceName] = {
                  state: ipLinkShowParseParam(netInterface, 'state'),
                  mode: ipLinkShowParseParam(netInterface, 'mode'),
                  mtu: ipLinkShowParseParam(netInterface, 'mtu'),
                  group: ipLinkShowParseParam(netInterface, 'group'),
                  qdisc: ipLinkShowParseParam(netInterface, 'qdisc'),
                  qlen: ipLinkShowParseParam(netInterface, 'qlen')
              }
          }
          callback(result)
      })
    }

    app.set('views', path.join(dir, 'views'));
    app.set('view engine', 'ejs');

    try {
        getInterfaces(function(interfaces){
            if(!interfaces || !interfaces.hasOwnProperty('wlan0')){
                return
            }

            if(interfaces.hasOwnProperty('eth0') && interfaces.eth0.hasOwnProperty('state') && interfaces.eth0.state.toLowerCase() === 'up'){
                setAP(false);
                return
            }

            iw.associated(function(err, associated){
                if(associated){
                    return
                }
                setAP(true, function(){
                    setTimeout(setAP, 600000, false)
                });
                app.use("/portal", bodyParser.urlencoded({ extended: true }));
                app.get("/portal", function(req, res) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    iw.scan(function(err, networks){
                        var wifilist;
                        if(err){
                            wifilist = [];
                        } else {
                            wifilist = networks.filter(function(e){
                                return (e.essid)?true:false;
                            }).filter((thing, index, self) =>
                                index === self.findIndex((t) => t.essid === thing.essid)
                            );
                        }

                        res.render('portal', {
                            wifilist: {
                                secured: wifilist.filter(function(d){return d.encrypted}),
                                open: wifilist.filter(function(d){return !d.encrypted})
                            }
                        });
                    });
                });

                app.post("/portal", function(req, res) {
                    var data = req.body;
                    if((data.secured === "true" || data.secured === true) && data.password === ""){
                        res.status(403).json({message: "Password should be filled", error: "no_password"})
                    } else {
                        setWiFi(data, function(err){
                            if(err){
                                res.status(500).json({message:"Cannot set the Wifi", error: err});
                            } else {
                                getHostname(function(err2, hostname){
                                    if(hostname){
                                        res.json({message: "The WiFi "+ data.ssid +" has been set.<br/>I will reboot in a few seconds.<br/>Please connect your computer/phone on this network.", hostname: hostname});
                                        setAP(false, function(){
                                             setTimeout(reboot, 2000);
                                        });
                                    } else {
                                        res.status(500).json({message:"Cannot get the hostname", error: err2});
                                    }
                                })
                            }
                        });
                    }
                });
            });
        });
    } catch(e){}

    return true;
}
